# /montaki_agenda/app.py

import os
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
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

# --- MODELOS DO BANCO DE DADOS (sem alteração) ---
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
    peso_pacote_gramas = db.Column(db.Float, nullable=False)
    preco_por_grama = db.Column(db.Float, nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- ROTAS PRINCIPAIS (sem alteração) ---
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
@app.route('/api/tarefas', methods=['GET'])
@login_required
def get_tarefas():
    tarefas_query = Tarefa.query.all()
    tarefas_dict = {}
    for tarefa in tarefas_query:
        if tarefa.data not in tarefas_dict:
            tarefas_dict[tarefa.data] = []
        # ALTERADO: Agora enviamos o ID e a descrição de cada tarefa
        tarefas_dict[tarefa.data].append({'id': tarefa.id, 'desc': tarefa.descricao})
    return jsonify(tarefas_dict)

@app.route('/api/tarefas', methods=['POST'])
@login_required
def add_tarefa():
    dados = request.get_json()
    nova_tarefa = Tarefa(data=dados['data'], descricao=dados['descricao'])
    db.session.add(nova_tarefa)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Tarefa adicionada!'}), 201

# NOVO: Rota para deletar uma tarefa específica
@app.route('/api/tarefas/<int:tarefa_id>', methods=['DELETE'])
@login_required
def delete_tarefa(tarefa_id):
    tarefa = Tarefa.query.get_or_404(tarefa_id)
    db.session.delete(tarefa)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Tarefa removida!'})


# --- API CALCULADORA (sem alteração) ---
@app.route('/api/ingredientes', methods=['GET', 'POST'])
@login_required
def api_ingredientes():
    if request.method == 'GET':
        # ... (código existente)
        ingredientes = Ingrediente.query.order_by(Ingrediente.nome).all()
        lista_ingredientes = [{'id': ing.id, 'nome': ing.nome, 'preco_pacote': ing.preco_pacote, 'peso_pacote_gramas': ing.peso_pacote_gramas, 'preco_por_grama': ing.preco_por_grama} for ing in ingredientes]
        return jsonify(lista_ingredientes)
    if request.method == 'POST':
        # ... (código existente)
        dados = request.get_json()
        preco_pacote = float(dados['preco_pacote'])
        peso_pacote_gramas = float(dados['peso_pacote_gramas'])
        if peso_pacote_gramas == 0: return jsonify({'status': 'erro', 'mensagem': 'O peso não pode ser zero.'}), 400
        preco_por_grama = preco_pacote / peso_pacote_gramas
        novo_ingrediente = Ingrediente(nome=dados['nome'], preco_pacote=preco_pacote, peso_pacote_gramas=peso_pacote_gramas, preco_por_grama=preco_por_grama)
        db.session.add(novo_ingrediente)
        db.session.commit()
        return jsonify({'status': 'sucesso', 'mensagem': 'Ingrediente adicionado!'}), 201

@app.route('/api/ingredientes/<int:id>', methods=['DELETE'])
@login_required
def delete_ingrediente(id):
    # ... (código existente)
    ingrediente = Ingrediente.query.get_or_404(id)
    db.session.delete(ingrediente)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Ingrediente removido!'})

# --- COMANDOS DE TERMINAL (sem alteração) ---
@app.cli.command('create-db')
def create_db(): db.create_all(); print("Banco de dados criado!")

@app.cli.command('create-user')
def create_user():
    # ... (código existente)
    import click
    username = click.prompt('Digite o nome de usuário')
    password = click.prompt('Digite a senha', hide_input=True, confirmation_prompt=True)
    if User.query.filter_by(username=username).first(): print(f"Usuário '{username}' já existe."); return
    new_user = User(username=username); new_user.set_password(password)
    db.session.add(new_user); db.session.commit()
    print(f"Usuário '{username}' criado com sucesso!")

if __name__ == '__main__': app.run(debug=True)