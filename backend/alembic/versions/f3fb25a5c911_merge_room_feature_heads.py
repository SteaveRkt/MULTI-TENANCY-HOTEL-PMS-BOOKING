"""Merge room feature migration heads

Revision ID: f3fb25a5c911
Revises: ('6b8d3f2a1c9b', 'a1b2c3d4e5f6')
Create Date: 2026-08-30 14:50:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3fb25a5c911'
down_revision: Union[str, Sequence[str], None] = ('6b8d3f2a1c9b', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge the two parallel room feature branches into one head."""
    pass


def downgrade() -> None:
    """Downgrade is a no-op because this is a merge migration."""
    pass
