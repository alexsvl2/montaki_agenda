# /montaki_agenda/app.py

import os
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

# --- CONFIGURAÇÃO INICIAL ---
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'agenda.db')
app.config['SECRET_KEY'] = 'sua-chave-secreta-super-dificil'
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Inicializar o Flask-Migrate
migrate = Migrate(app, db)

# --- MODELOS DO BANCO DE DADOS ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    def set_password(self, password): self.password_hash = generate_password_hash(password)
    def check_password(self, password): return check_password_hash(self.password_hash, password)

class Tarefa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(10), nullable=False)
    descricao = db.Column(db.String(200), nullable=False)

class Ingrediente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    preco_pacote = db.Column(db.Float, nullable=False)
    quantidade_pacote = db.Column(db.Float, nullable=False)
    unidade_medida = db.Column(db.String(5), nullable=False)
    custo_unitario_base = db.Column(db.Float, nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- ROTAS PRINCIPAIS ---
@app.route('/', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated: return redirect(url_for('home'))
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user and user.check_password(request.form['password']):
            login_user(user)
            return redirect(url_for('home'))
        return redirect(url_for('login'))
    return render_template('login.html')

@app.route('/home')
@login_required
def home():
    return render_template('home.html', username=current_user.username)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/calendario')
@login_required
def calendario():
    return render_template('calendario.html', username=current_user.username, show_back_button=True)

@app.route('/calculadora')
@login_required
def calculadora():
    return render_template('calculadora.html', username=current_user.username, show_back_button=True)

# --- API AGENDA ---
@app.route('/api/tarefas', methods=['GET', 'POST'])
@login_required
def api_tarefas():
    if request.method == 'GET':
        tarefas = Tarefa.query.all()
        tarefas_dict = {}
        for tarefa in tarefas:
            if tarefa.data not in tarefas_dict: tarefas_dict[tarefa.data] = []
            tarefas_dict[tarefa.data].append(tarefa.descricao)
        return jsonify(tarefas_dict)
    if request.method == 'POST':
        dados = request.get_json()
        nova_tarefa = Tarefa(data=dados['data'], descricao=dados['descricao'])
        db.session.add(nova_tarefa)
        db.session.commit()
        return jsonify({'status': 'sucesso'})

# --- API CALCULADORA ---
@app.route('/api/ingredientes', methods=['GET'])
@login_required
def get_ingredientes():
    ingredientes = Ingrediente.query.order_by(Ingrediente.nome).all()
    lista_ingredientes = [{
        'id': ing.id,
        'nome': ing.nome,
        'preco_pacote': ing.preco_pacote,
        'quantidade_pacote': ing.quantidade_pacote,
        'unidade_medida': ing.unidade_medida,
        'custo_unitario_base': ing.custo_unitario_base
    } for ing in ingredientes]
    return jsonify(lista_ingredientes)

@app.route('/api/ingredientes', methods=['POST'])
@login_required
def add_ingrediente():
    dados = request.get_json()
    preco_pacote = float(dados['preco_pacote'])
    quantidade_pacote = float(dados['quantidade_pacote'])
    unidade_medida = dados['unidade_medida']
    if quantidade_pacote == 0:
        return jsonify({'status': 'erro', 'mensagem': 'A quantidade não pode ser zero.'}), 400
    custo_unitario_base = preco_pacote / quantidade_pacote
    novo_ingrediente = Ingrediente(
        nome=dados['nome'],
        preco_pacote=preco_pacote,
        quantidade_pacote=quantidade_pacote,
        unidade_medida=unidade_medida,
        custo_unitario_base=custo_unitario_base
    )
    db.session.add(novo_ingrediente)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Ingrediente adicionado!'}), 201

@app.route('/api/ingredientes/<int:id>', methods=['DELETE'])
@login_required
def delete_ingrediente(id):
    ingrediente = Ingrediente.query.get_or_404(id)
    db.session.delete(ingrediente)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Ingrediente removido!'})

# --- COMANDOS DE TERMINAL ---
@app.cli.command('create-db')
def create_db():
    db.create_all()
    print("Banco de dados e tabelas criados/atualizados com sucesso!")

@app.cli.command('create-user')
def create_user():
    import click
    username = click.prompt('Digite o nome de usuário')
    password = click.prompt('Digite a senha', hide_input=True, confirmation_prompt=True)
    if User.query.filter_by(username=username).first():
        print(f"Usuário '{username}' já existe.")
        return
    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    print(f"Usuário '{username}' criado com sucesso!")

if __name__ == '__main__':
    app.run(debug=True)