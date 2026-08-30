"""Add room rating fields

Revision ID: 6b8d3f2a1c9b
Revises: 0cc444416575
Create Date: 2026-08-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6b8d3f2a1c9b"
down_revision: Union[str, Sequence[str], None] = "0cc444416575"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("rooms") as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Numeric(precision=3, scale=2), nullable=False, server_default="0.00"))
        batch_op.add_column(sa.Column("reviews_count", sa.Integer(), nullable=False, server_default="0"))

    with op.batch_alter_table("rooms") as batch_op:
        batch_op.alter_column("rating", server_default=None)
        batch_op.alter_column("reviews_count", server_default=None)


def downgrade() -> None:
    with op.batch_alter_table("rooms") as batch_op:
        batch_op.drop_column("reviews_count")
        batch_op.drop_column("rating")
