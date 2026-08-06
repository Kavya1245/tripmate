"""change time column to string

Revision ID: 3b8ee20fb884
Revises: d6361d51372e
Create Date: 2026-08-06 15:01:35.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b8ee20fb884'
down_revision: Union[str, None] = 'd6361d51372e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility
    with op.batch_alter_table('itinerary_items', schema=None) as batch_op:
        batch_op.alter_column('time', existing_type=sa.TIME(), type_=sa.String(length=10), existing_nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('itinerary_items', schema=None) as batch_op:
        batch_op.alter_column('time', existing_type=sa.String(length=10), type_=sa.TIME(), existing_nullable=True)
