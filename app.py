# /montaki_agenda/app.py

import os
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# --- CONFIGURAÇÃO INICIAL ---
app = Flask(__name__)

# Configuração do Banco de Dados SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'agenda.db')
app.config['SECRET_KEY'] = 'sua-chave-secreta-super-dificil' # Troque por uma chave real e secreta
db = SQLAlchemy(app)

# Configuração do Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login' # Redireciona para a rota 'login' se não estiver logado

# --- MODELOS DO BANCO DE DADOS ---

# Modelo de Usuário para Login
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Modelo de Tarefa para a Agenda
class Tarefa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(10), nullable=False) # Formato 'YYYY-MM-DD'
    descricao = db.Column(db.String(200), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- ROTAS DA APLICAÇÃO ---

@app.route('/', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('calendario'))

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('calendario'))
        else:
            # Futuramente, adicione uma mensagem de erro aqui
            return redirect(url_for('login'))
            
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/calendario')
@login_required
def calendario():
    return render_template('calendario.html', username=current_user.username)

# --- API PARA O CALENDÁRIO (JavaScript vai usar isso) ---

@app.route('/api/tarefas', methods=['GET'])
@login_required
def get_tarefas():
    tarefas = Tarefa.query.all()
    # Transforma a lista de tarefas em um dicionário onde a chave é a data
    tarefas_dict = {}
    for tarefa in tarefas:
        if tarefa.data not in tarefas_dict:
            tarefas_dict[tarefa.data] = []
        tarefas_dict[tarefa.data].append(tarefa.descricao)
    return jsonify(tarefas_dict)


@app.route('/api/tarefas', methods=['POST'])
@login_required
def add_tarefa():
    dados = request.get_json()
    nova_tarefa = Tarefa(data=dados['data'], descricao=dados['descricao'])
    db.session.add(nova_tarefa)
    db.session.commit()
    return jsonify({'status': 'sucesso', 'mensagem': 'Tarefa adicionada!'})


# --- COMANDO PARA CRIAR O PRIMEIRO USUÁRIO ---
# No terminal, rode: flask create-db e depois flask create-user admin senha_segura
@app.cli.command('create-db')
def create_db():
    """Cria as tabelas do banco de dados."""
    db.create_all()
    print("Banco de dados criado com sucesso!")

@app.cli.command('create-user')
def create_user():
    """Cria um usuário administrador."""
    import click
    username = click.prompt('Digite o nome de usuário')
    password = click.prompt('Digite a senha', hide_input=True, confirmation_prompt=True)
    
    # Verifica se o usuário já existe
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