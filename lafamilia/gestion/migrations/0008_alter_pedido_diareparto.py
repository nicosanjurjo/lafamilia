# Generated by Django 5.0.7 on 2024-09-22 18:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0007_alter_pedido_total'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pedido',
            name='diareparto',
            field=models.CharField(blank=True, choices=[('Lunes', 'Lunes'), ('Miércoles', 'Miércoles'), ('Viernes', 'Viernes'), ('Sábado', 'Sábado')], max_length=10, null=True),
        ),
    ]
