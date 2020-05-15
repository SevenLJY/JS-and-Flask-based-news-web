import json
from collections import Counter
from flask import Flask, jsonify, request
from newsapi import NewsApiClient
import re

app = Flask(__name__)
PAGE_SIZE = 30
LANG = 'en'

@app.route('/', methods=['GET'])
def get_index():
    return app.send_static_file("index.html")


@app.route('/search', methods=['GET'])
def search():
    data_dict = request.args

    newsapi = NewsApiClient(api_key='e9e7b816554a4defb4d1d83e793fc90f')

    try:
        if(data_dict['source'] == ''):
            all_articles = newsapi.get_everything(q=data_dict["keyword"],
                                              from_param=data_dict["from"],
                                              to=data_dict["to"],
                                              language=LANG,
                                              sort_by='publishedAt',
                                              page_size=PAGE_SIZE)
        else:
            all_articles = newsapi.get_everything(q=data_dict["keyword"],
                                                  sources=data_dict["source"],
                                                  from_param=data_dict["from"],
                                                  to=data_dict["to"],
                                                  language=LANG,
                                                  sort_by='publishedAt',
                                                  page_size=PAGE_SIZE)

    except Exception as error:
        errorMsg = error.exception
        return jsonify({'status': errorMsg['status'], 'message': errorMsg['message']})
    else:
        articles_filtered = getFiltered(all_articles, 15)
        if (len(articles_filtered["articles"]) == 0):
            return jsonify({'hasResult': False})
        return jsonify({'status': 'ok', 'hasResult': True, 'articles': articles_filtered})




@app.route('/getSource', methods=['GET'])
def get_source():
    option = request.args
    newsapi = NewsApiClient(api_key='e9e7b816554a4defb4d1d83e793fc90f')
    sources = newsapi.get_sources(category=option["category"], language=LANG)
    return jsonify({"sources": sources["sources"]})

@app.route('/index', methods=['GET'])
def index():
    # Init
    newsapi = NewsApiClient(api_key='e9e7b816554a4defb4d1d83e793fc90f')
    # /v2/top-headlines: send request to Google News API
    top_headlines = newsapi.get_top_headlines(language=LANG, page_size=PAGE_SIZE)
    cnn_headlines = newsapi.get_top_headlines(sources='cnn', language=LANG, page_size=PAGE_SIZE)
    fox_headlines = newsapi.get_top_headlines(sources='fox-news', language=LANG, page_size=PAGE_SIZE)
    # Filter for incomplete records
    top_filtered = getFiltered(top_headlines, 5)
    cnn_filtered = getFiltered(cnn_headlines, 4)
    fox_filtered = getFiltered(fox_headlines, 4)
    # Extract titles of all articles
    titles = []
    headlines = newsapi.get_top_headlines(language=LANG, page_size=100)
    titles = extract_titles(headlines)
    # Find top 30 frequently used words
    top_words = find_freq_used(titles)
    return jsonify([top_filtered, cnn_filtered, fox_filtered, top_words])


def getFiltered(records, num):
    articles = records["articles"]
    filtered_records = []
    for article in articles:
        if checkComplete(article):
            filtered_records.append(article)
        if filtered_records.__len__() == num:
            break
    return {"articles": filtered_records}

def checkComplete(article):
    for (key, value) in article.items():
        if key == 'source':
            if value.items() is None:
                return False
        else:
            if value is None or value == '':
                return False
    return True

def extract_titles(records):
    titles = []
    articles = records["articles"]
    for article in articles:
        if article["title"] is not None:
            titles.append(article["title"].strip())
    return titles

def find_freq_used(titles):
    # Count frequency for every word
    word_cnt = Counter()
    # Get stopwords from txt file
    file = open(r'./static/stopwords_en.txt')
    stopwords = set(file.read().splitlines())

    # Filter extra symbols with regular expression
    regx = re.compile('[:|!|~|(|)|&|;|$|#|@|*|^|\||/|,|"|—|\'|?]*')

    for title in titles:
        for word in title.split():
            # replace extra symbols with ""
            pure_word = regx.sub("", word)
            if pure_word == '' or pure_word == '-':
                continue
            # check if word is in the list of stopwords
            if pure_word.lower() not in stopwords:
                word_cnt[pure_word] += 1
    file.close()
    top30_tuples = Counter(word_cnt).most_common(30)
    top30_list_of_dict = []
    for (str, freq) in top30_tuples:
        item = {}
        item['word'] = str
        item['size'] = freq
        top30_list_of_dict.append(item)
    return top30_list_of_dict




if __name__ == '__main__':
    app.run()
