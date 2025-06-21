from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

JSON_FILES = [
    "json/products.json",
    "json/fasteners.json"
    #"json/leader_t.json"
]

def load_full_catalog():
    catalog = {}
    for path in JSON_FILES:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # data — это словарь с одной основной категорией
                catalog.update(data)
    return catalog

@app.route("/api/catalog", methods=["GET"])
def api_catalog():
    catalog = load_full_catalog()
    return jsonify(catalog)

@app.route('/api/order', methods=['POST'])
def order():
    data = request.json
    items = data.get('items', [])
    company = data.get('company', '')
    name = data.get('name', '')
    phone = data.get('phone', '')
    email = data.get('email', '')
    comment = data.get('comment', '')

    # Только название и число, по одному на строку
    body = "\n".join(
        f"{item['name']}: {item['count']}" for item in items
    )
    # Добавляем реквизиты
    body += f"\n\nКомпания: {company}\nИмя: {name}\nТелефон: {phone}\nEmail: {email}\nКомментарий: {comment}"

    msg = MIMEText(body, _charset='utf-8')
    msg['Subject'] = 'Заказ с сайта интелснаб.рф'
    msg['From'] = 'Grigorijkasurin5611@gmail.com'
    msg['To'] = 'intelsnab52@bk.ru'

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login('Grigorijkasurin5611@gmail.com', 'ilbx qake smbt ishy')
            server.send_message(msg)
        return jsonify({'status': 'ok'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/callback', methods=['POST'])
def callback():
    data = request.json
    body = f"""Заявка с сайта:
Компания: {data.get('company')}
Имя: {data.get('name')}
Телефон: {data.get('phone')}
Email: {data.get('email')}
Комментарий: {data.get('comment')}
"""
    msg = MIMEText(body, _charset='utf-8')
    msg['Subject'] = 'Заявка с сайта (обратный звонок)'
    msg['From'] = 'Grigorijkasurin5611@gmail.com'  # замените на ваш email
    msg['To'] = 'intelsnab52@bk.ru'    # замените на нужный email

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login('Grigorijkasurin5611@gmail.com', 'ilbx qake smbt ishy')
            server.send_message(msg)
        return jsonify({'status': 'ok'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == "__main__":
    app.run(host="81.19.135.188", port=5001)