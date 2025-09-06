Flask-Migrate quick commands:

1) Initialize once:
   flask db init

2) Generate migration after model changes:
   flask db migrate -m "<message>"

3) Apply migration:
   flask db upgrade

Make sure virtual environment is active and FLASK_APP=src.main (set in .flaskenv).