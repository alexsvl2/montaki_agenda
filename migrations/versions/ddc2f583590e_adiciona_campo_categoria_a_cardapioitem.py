"""Adiciona campo categoria a CardapioItem

Revision ID: ddc2f583590e
Revises: 5060738238f6
Create Date: 2025-07-16 23:12:27.501884

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ddc2f583590e'
down_revision = '5060738238f6'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('cardapio_item', schema=None) as batch_op:
        batch_op.add_column(sa.Column('categoria', sa.String(length=100), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('cardapio_item', schema=None) as batch_op:
        batch_op.drop_column('categoria')

    # ### end Alembic commands ###
