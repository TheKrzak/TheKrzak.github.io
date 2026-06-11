from flask import Flask, render_template, request, redirect, url_for
import sqlite3
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'baza.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    conn = get_db_connection()
    data = conn.execute('SELECT * FROM Cars').fetchall()
    conn.close()
    return render_template('lista.html', items=data)

@app.route('/pokaz/<int:item_id>')
def pokaz(item_id):
    conn = get_db_connection()
    # Pobieramy auto z tabeli Cars na podstawie przekazanego ID
    car = conn.execute('SELECT * FROM Cars WHERE id = ?', (item_id,)).fetchone()
    conn.close()

    # Jeśli auto o takim ID nie istnieje, wyrzuć błąd
    if car is None:
        return "Nie znaleziono takiego samochodu w bazie!", 404

    # Przekazujemy zmienną 'car' do szablonu podglad.html
    return render_template('podglad.html', car=car)


@app.route('/dodaj', methods=('GET', 'POST'))
def dodaj():
    if request.method == 'POST':
        brand = request.form['Brand']
        model = request.form['Model']
        year = request.form['Year']

        conn = get_db_connection()
        conn.execute('INSERT INTO Cars (Brand, Model, Year) VALUES (?, ?, ?)',
                     (brand, model, year))
        conn.commit()
        conn.close()

        return redirect(url_for('index'))

    return render_template('tworz.html')


@app.route('/edytuj/<int:item_id>', methods=('GET', 'POST'))
def edytuj(item_id):
    conn = get_db_connection()
    # 1. Pobieramy auto, które użytkownik chce edytować
    car = conn.execute('SELECT * FROM Cars WHERE id = ?', (item_id,)).fetchone()

    if car is None:
        conn.close()
        return "Nie znaleziono takiego samochodu w bazie!", 404

    # 2. Jeśli użytkownik wysłał formularz (POST), aktualizujemy dane
    if request.method == 'POST':
        brand = request.form['Brand']
        model = request.form['Model']
        year = request.form['Year']

        conn.execute('UPDATE Cars SET Brand = ?, Model = ?, Year = ? WHERE id = ?',
                     (brand, model, year, item_id))
        conn.commit()
        conn.close()

        # Po aktualizacji wracamy na listę główną
        return redirect(url_for('index'))

    # 3. Jeśli to żądanie GET, zamykamy połączenie i pokazujemy formularz z danymi auta
    conn.close()
    return render_template('edytuj.html', car=car)


@app.route('/usun/<int:item_id>', methods=('POST',))
def usun(item_id):
    conn = get_db_connection()
    # Wykonujemy zapytanie SQL usuwające wybrany rekord
    conn.execute('DELETE FROM Cars WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()

    # Po usunięciu wracamy na listę główną, gdzie tego auta już nie będzie
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Wymagany port 57706
    app.run(port=57706, debug=True)