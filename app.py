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
    peso_pacote_gramas = db.Column(db.Float, nullable=False)
    preco_por_grama = db.Column(db.Float, nullable=False)

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    custo_total = db.Column(db.Float, default=0.0)
    # Relacionamento com os itens da receita
    receita_itens = db.relationship('ReceitaItem', backref='produto', lazy=True, cascade="all, delete-orphan")

class ReceitaItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gramas = db.Column(db.Float, nullable=False)
    custo_item = db.Column(db.Float, nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'), nullable=False)
    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingrediente.id'), nullable=False)
    # Relacionamento para acessar os dados do ingrediente facilmente
    ingrediente = db.relationship('Ingrediente', backref='receita_itens')

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
            login_user(user); return redirect(url_for('home'))
        return redirect(url_for('login'))
    return render_template('login.html')

@app.route('/home')
@login_required
def home(): return render_template('home.html', username=current_user.username)

@app.route('/logout')
@login_required
def logout(): logout_user(); return redirect(url_for('login'))

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
@app.route('/api/tarefas', methods=['GET'])
@login_required
def get_tarefas():
    tarefas_query = Tarefa.query.all()
    tarefas_dict = {}
    for tarefa in tarefas_query:
        if tarefa.data not in tarefas_dict:
            tarefas_dict[tarefa.data] = []
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

@app.route('/api/tarefas/<int:tarefa_id>', methods=['DELETE'])
@login_required
def delete_tarefa(tarefa_id):
    tarefa = Tarefa.query.get_or_404(tarefa_id)
    db.session.delete(tarefa)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Tarefa removida!'})

@app.route('/api/ingredientes', methods=['GET', 'POST'])
@login_required
def api_ingredientes():
    if request.method == 'GET':
        ingredientes = Ingrediente.query.order_by(Ingrediente.nome).all()
        lista_ingredientes = [{'id': ing.id, 'nome': ing.nome, 'preco_pacote': ing.preco_pacote, 'peso_pacote_gramas': ing.peso_pacote_gramas, 'preco_por_grama': ing.preco_por_grama} for ing in ingredientes]
        return jsonify(lista_ingredientes)
    if request.method == 'POST':
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
    ingrediente = Ingrediente.query.get_or_404(id)
    db.session.delete(ingrediente)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Ingrediente removido!'})

@app.route('/api/ingredientes/search')
@login_required
def search_ingredientes():
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
    ingredientes = Ingrediente.query.filter(Ingrediente.nome.ilike(f'%{query}%')).limit(10).all()
    return jsonify([{'id': ing.id, 'nome': ing.nome} for ing in ingredientes])

@app.route('/api/produtos', methods=['GET'])
@login_required
def get_produtos():
    produtos = Produto.query.order_by(Produto.nome).all()
    return jsonify([{'id': p.id, 'nome': p.nome} for p in produtos])

@app.route('/api/produtos', methods=['POST'])
@login_required
def create_produto():
    dados = request.get_json()
    novo_produto = Produto(nome=dados['nome'])
    db.session.add(novo_produto)
    db.session.commit()
    return jsonify({'id': novo_produto.id, 'nome': novo_produto.nome}), 201

@app.route('/api/produtos/<int:produto_id>', methods=['GET'])
@login_required
def get_produto_detalhe(produto_id):
    produto = Produto.query.get_or_404(produto_id)
    receita = [{
        'item_id': item.id,
        'ingrediente_nome': item.ingrediente.nome,
        'gramas': item.gramas,
        'custo_item': item.custo_item
    } for item in produto.receita_itens]
    
    return jsonify({
        'id': produto.id,
        'nome': produto.nome,
        'custo_total': produto.custo_total,
        'receita': receita
    })

@app.route('/api/produtos/<int:produto_id>/ingredientes', methods=['POST'])
@login_required
def add_ingrediente_receita(produto_id):
    produto = Produto.query.get_or_404(produto_id)
    dados = request.get_json()
    ingrediente = Ingrediente.query.get_or_404(dados['ingrediente_id'])
    gramas = float(dados['gramas'])
    custo_do_item = ingrediente.preco_por_grama * gramas
    novo_item_receita = ReceitaItem(
        produto_id=produto.id,
        ingrediente_id=ingrediente.id,
        gramas=gramas,
        custo_item=custo_do_item
    )
    db.session.add(novo_item_receita)
    produto.custo_total += custo_do_item
    db.session.commit()
    return jsonify({'status': 'sucesso'}), 201

@app.route('/api/receita_item/<int:item_id>', methods=['DELETE'])
@login_required
def delete_receita_item(item_id):
    item = ReceitaItem.query.get_or_404(item_id)
    produto = item.produto
    produto.custo_total -= item.custo_item
    db.session.delete(item)
    db.session.commit()
    return jsonify({'status': 'sucesso'})

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