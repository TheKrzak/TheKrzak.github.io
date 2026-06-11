import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'baza.db')

def stworz_baze():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Tworzenie tabeli Cars z odpowiednimi kolumnami
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Brand TEXT NOT NULL,
            Model TEXT NOT NULL,
            Year INTEGER NOT NULL
        )
    ''')

    # 2. Czyszczenie tabeli na wypadek ponownego uruchomienia (żeby nie dublować)
    cursor.execute('DELETE FROM Cars')

    # 3. Przykładowe dane do wstrzyknięcia
    autka = [
        ('BMW', 'M3', 2021),
        ('Audi', 'A4', 2019),
        ('Toyota', 'Yaris', 2022),
        ('Ford', 'Mustang', 1967)
    ]

    # 4. Wrzucenie danych do bazy
    cursor.executemany('INSERT INTO Cars (Brand, Model, Year) VALUES (?, ?, ?)', autka)

    # Zapisanie zmian i zamknięcie połączenia
    conn.commit()
    conn.close()
    print("Baza danych 'baza.db' została stworzona i uzupełniona autami!")

if __name__ == '__main__':
    stworz_baze()