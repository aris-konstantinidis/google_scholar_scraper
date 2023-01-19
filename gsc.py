import pandas as pd
import requests as req
import time
import json
import random

# CONSTANTS
query_params = pd.read_csv("econ_act.csv")
REQUEST_INTERVAL = 5  # seconds
years = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]
sources = []
core_words = ["blockchain"]  # could also loop though an array of core_words


unique_activities = query_params.economic_activity.unique()



# CREATE DENSITY COLLECTION
densities = {}  # densities[year][category]

# populate year keys
for year in range(2014, 2024):

    densities[year] = {}

    # populate economic activity category for this year
    for activity in range(len(unique_activities)):

        densities[year][unique_activities[activity]] = 0


googleTrendsUrl = 'https://scholar.google.com'
response = req.get(googleTrendsUrl)
if response.status_code == 200:
    g_cookies = response.cookies.get_dict()

# FETCH CATEGORY COUNT


def getCategoryCount(index, start_year, end_year, category, core_word, key_title):

    key_title = replace_whitespaces(key_title)

    url = f'https://scholar.google.com/scholar?hl=en&lr=lang_en&as_sdt=0%2C5&as_ylo={start_year}&as_yhi={end_year}&q=intitle%3A{core_word}+AND+intitle%3A{key_title}&btnG='

    headers = {
        'User-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'}
    res = req.get(url, headers=headers, cookies=g_cookies)

    print("Year: ", start_year, " Entry: ", index,
          " Status Code: ", res.status_code)
    print("Category: ", category)

    print("URL: ", url)

    num_of_articles_string = (str(res.content).split(
        " result")[0]).split('<div class="gs_ab_mdw">')[-1]

    if len(num_of_articles_string.split(" ")) > 1:

        num_of_articles_string = num_of_articles_string.split(" ")[-1]

    density = string_to_int(num_of_articles_string)

    print("Density: ", density, "\n")

    return density


def string_to_int(s):
    try:
        return int(s)
    except ValueError:
        return 0


def replace_whitespaces(s):
    if " " in s:
        return f'"{s.replace(" ", "+")}"'
    else:
        return s


def write_to_json(data, filename):
    with open(filename, 'w') as outfile:
        json.dump(data, outfile)


# START FETCHING DATA AND FILLING THE DENSITY COLLECTION SEQUENCIALLY
# iterate over all years
for year in range(len(years)):

    # iterate over all core_words
    for core_word in range(len(core_words)):

        # iterate over all sources
        # for source in range(len(sources)):

        # iterate over all query_params
        for entry in range(len(query_params)):

            category = query_params.iloc[67].economic_activity
            key_title = query_params.iloc[67].keywords_in_title
            key_text_1 = query_params.iloc[67].keyword_in_text_at_least2_1
            key_text_2 = query_params.iloc[67].keyword_in_text_at_least2_2

            count = getCategoryCount(
                entry, years[year], years[year], category, core_words[core_word], key_title)

            densities[years[year]][category] = densities[years[year]
                                                         ][category] + count

            # STORE DATA IN FILE
            write_to_json(
                densities, "economic_activitiy_densities_2014_2022.json")

            time.sleep(random.randint(15, 60)/100)


# Check that verbs and keywords must be at least 2 times within the articles if not in the title

# "blockchain* AND mining* AND iron* source:"Review of International Political Economy""
# url = f'https://scholar.google.com/scholar?hl=en&lr=lang_en&as_sdt=0%2C5&as_ylo={year}&as_yhi={year}&q={core_word}+AND+{key_title}+AND+{keywords[0]}+source%3A"{sources[0]}"&btnG='
