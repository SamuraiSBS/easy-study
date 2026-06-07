"""Add order attachments.

Revision ID: 0002_order_attachments
Revises: 0001_initial
Create Date: 2026-06-07
"""

import sqlalchemy as sa

from alembic import op

revision = "0002_order_attachments"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "order_attachments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_attachments_created_at"), "order_attachments", ["created_at"], unique=False)
    op.create_index(op.f("ix_order_attachments_order_id"), "order_attachments", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_order_attachments_order_id"), table_name="order_attachments")
    op.drop_index(op.f("ix_order_attachments_created_at"), table_name="order_attachments")
    op.drop_table("order_attachments")
