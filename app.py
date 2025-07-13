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

class ReceitaItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'), nullable=False)
    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingrediente.id'), nullable=False)
    quantidade = db.Column(db.Float, nullable=False)
    ingrediente = db.relationship('Ingrediente')

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    custo_total = db.Column(db.Float, default=0.0)
    receita = db.relationship('ReceitaItem', backref='produto', lazy=True, cascade="all, delete-orphan")
    
    def calcular_custo_total(self):
        novo_custo = 0
        for item in self.receita:
            custo_item = item.ingrediente.custo_unitario_base * item.quantidade
            novo_custo += custo_item
        self.custo_total = novo_custo
        db.session.commit()

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
def home(): return render_template('home.html', username=current_user.username)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/calendario')
@login_required
def calendario(): return render_template('calendario.html', username=current_user.username, show_back_button=True)

@app.route('/calculadora')
@login_required
def calculadora(): return render_template('calculadora.html', username=current_user.username, show_back_button=True)

@app.route('/produtos')
@login_required
def produtos():
    return render_template('produtos.html', username=current_user.username, show_back_button=True)

# --- APIs ---
# (API da Agenda)
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

# (API da Calculadora)
@app.route('/api/ingredientes', methods=['GET'])
@login_required
def get_ingredientes():
    ingredientes = Ingrediente.query.order_by(Ingrediente.nome).all()
    lista_ingredientes = [{'id': ing.id, 'nome': ing.nome, 'preco_pacote': ing.preco_pacote, 'quantidade_pacote': ing.quantidade_pacote, 'unidade_medida': ing.unidade_medida, 'custo_unitario_base': ing.custo_unitario_base} for ing in ingredientes]
    return jsonify(lista_ingredientes)

@app.route('/api/ingredientes', methods=['POST'])
@login_required
def add_ingrediente():
    dados = request.get_json()
    custo_unitario_base = float(dados['preco_pacote']) / float(dados['quantidade_pacote'])
    novo_ingrediente = Ingrediente(nome=dados['nome'], preco_pacote=float(dados['preco_pacote']), quantidade_pacote=float(dados['quantidade_pacote']), unidade_medida=dados['unidade_medida'], custo_unitario_base=custo_unitario_base)
    db.session.add(novo_ingrediente)
    db.session.commit()
    return jsonify({'status': 'sucesso'}), 201

@app.route('/api/ingredientes/<int:id>', methods=['DELETE'])
@login_required
def delete_ingrediente(id):
    ingrediente = Ingrediente.query.get_or_404(id)
    db.session.delete(ingrediente)
    db.session.commit()
    return jsonify({'status': 'sucesso'})

# (API de Produtos)
@app.route('/api/produtos', methods=['GET'])
@login_required
def get_produtos():
    produtos = Produto.query.order_by(Produto.nome).all()
    return jsonify([{'id': p.id, 'nome': p.nome} for p in produtos])

@app.route('/api/produtos', methods=['POST'])
@login_required
def add_produto():
    dados = request.get_json()
    if not dados or 'nome' not in dados or not dados['nome'].strip():
        return jsonify({'status': 'erro', 'mensagem': 'Nome do produto é obrigatório.'}), 400
    novo_produto = Produto(nome=dados['nome'].strip())
    db.session.add(novo_produto)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'produto': {'id': novo_produto.id, 'nome': novo_produto.nome}}), 201

@app.route('/api/produto/<int:produto_id>', methods=['GET'])
@login_required
def get_detalhe_produto(produto_id):
    produto = Produto.query.get_or_404(produto_id)
    receita_formatada = [{'item_id': item.id, 'ingrediente_id': item.ingrediente.id, 'ingrediente_nome': item.ingrediente.nome, 'quantidade': item.quantidade, 'unidade_medida': item.ingrediente.unidade_medida, 'custo_item': item.ingrediente.custo_unitario_base * item.quantidade} for item in produto.receita]
    return jsonify({'id': produto.id, 'nome': produto.nome, 'custo_total': produto.custo_total, 'receita': receita_formatada})

@app.route('/api/produto/<int:produto_id>/ingrediente', methods=['POST'])
@login_required
def add_ingrediente_receita(produto_id):
    produto = Produto.query.get_or_404(produto_id)
    dados = request.get_json()
    ingrediente = Ingrediente.query.get(dados['ingrediente_id'])
    if not ingrediente: return jsonify({'status': 'erro', 'mensagem': 'Ingrediente não encontrado.'}), 404
    novo_item = ReceitaItem(produto_id=produto.id, ingrediente_id=dados['ingrediente_id'], quantidade=float(dados['quantidade']))
    db.session.add(novo_item)
    db.session.commit()
    produto.calcular_custo_total()
    return jsonify({'status': 'sucesso'})
    
@app.route('/api/receita_item/<int:item_id>', methods=['DELETE'])
@login_required
def delete_item_receita(item_id):
    item = ReceitaItem.query.get_or_404(item_id)
    produto = item.produto
    db.session.delete(item)
    db.session.commit()
    produto.calcular_custo_total()
    return jsonify({'status': 'sucesso'})
    
# --- Comandos de Terminal ---
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