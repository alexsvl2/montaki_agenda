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
login_manager.login_view = 'login'

# --- MODELOS DO BANCO DE DADOS ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Tarefa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(10), nullable=False)
    descricao = db.Column(db.String(200), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- ROTAS DA APLICAÇÃO ---
@app.route('/', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('home'))
        else:
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

# --- API PARA O CALENDÁRIO ---
@app.route('/api/tarefas', methods=['GET'])
@login_required
def get_tarefas():
    tarefas = Tarefa.query.all()
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

# --- COMANDOS DE TERMINAL ---
@app.cli.command('create-db')
def create_db():
    db.create_all()
    print("Banco de dados criado com sucesso!")

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