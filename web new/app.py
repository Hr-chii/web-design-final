from flask import Flask, render_template, jsonify, request
from datetime import datetime

app = Flask(__name__)

# 交通工具的碳排放係數 (公克CO2/公里)
EMISSION_FACTORS = {
    'car': 171.0,  # 私家車
    'bus': 82.0,   # 公車
    'bike': 0.0,   # 自行車
    'walk': 0.0,   # 步行
    'mrt': 55.0    # 捷運
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/challenges')
def challenges():
    return render_template('challenges.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/api/calculate-emission', methods=['POST'])
def calculate_emission():
    data = request.json
    distance = float(data['distance'])
    transport_type = data['transportType']
    
    # 計算每日碳排放
    daily_emission = (EMISSION_FACTORS[transport_type] * distance) / 1000  # 轉換為公斤
    monthly_emission = daily_emission * 22  # 假設每月22個工作天
    yearly_emission = monthly_emission * 12
    
    # 計算環保指數
    max_emission = EMISSION_FACTORS['car'] * distance / 1000  # 以私家車為基準
    emission_score = ((max_emission - daily_emission) / max_emission) * 100
    
    # 根據交通方式提供建議
    alternatives = get_transport_alternatives(transport_type, distance)
    
    return jsonify({
        'dailyEmission': daily_emission,
        'monthlyEmission': monthly_emission,
        'yearlyEmission': yearly_emission,
        'emissionScore': emission_score,
        'alternatives': alternatives
    })

def get_transport_alternatives(current_type, distance):
    suggestions = []
    
    if current_type == 'car':
        if distance < 5:
            suggestions.append("短程通勤建議改騎自行車或步行，可以減少100%的碳排放。\nFor short distances, consider biking or walking to reduce carbon emissions by 100%.")
        suggestions.append("搭乘大眾運輸可以減少約52%的碳排放。\nUsing public transportation can reduce carbon emissions by about 52%.")
    elif current_type == 'bus':
        if distance < 3:
            suggestions.append("可以考慮騎自行車或步行，既環保又健康。\nConsider biking or walking - it's both eco-friendly and healthy.")
    elif current_type in ['bike', 'walk']:
        suggestions.append("您選擇了最環保的交通方式，請繼續保持！\nYou've chosen the most eco-friendly transportation method. Keep it up!")
    
    return " ".join(suggestions) if suggestions else None

if __name__ == '__main__':
    app.run(debug=True)