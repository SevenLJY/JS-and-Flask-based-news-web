var select_category = document.getElementById ("category");
select_category.addEventListener ('click', (event) => {
    let option = event.target.value;
    let url = "/getSource?category=" + option;
    if (option !== "") {
        var xhttp = new XMLHttpRequest ();
        xhttp.open ('GET', url);
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                showSources (this.responseText);
            }
        };
        xhttp.send ();
    } else {
        var source = document.getElementById ("source");
        source.innerHTML = "";
        var all = document.createElement ("option");
        all.setAttribute ("value", "");
        all.innerHTML = "All";
        source.appendChild (all);
    }

});

document.getElementById ("reset").addEventListener ("click", function () {
    document.getElementById ("news-search").innerHTML = "";
});


function showSources (jsonData) {
    var sources_list = JSON.parse (jsonData).sources;
    var sourcePos = document.getElementById ("source");
    sourcePos.innerHTML = "";
    var all = document.createElement ("option");
    all.setAttribute ("value", "");
    all.innerHTML = "All";
    sourcePos.appendChild (all);
    for (source of sources_list) {
        let opt = document.createElement ('option');
        opt.value = source.id;
        opt.innerHTML = source.name;
        sourcePos.appendChild (opt);
    }
}

function searchOn () {
    // Control the nav bar
    document.getElementById ("searchNav").classList.add ("activated");
    document.getElementById ("newsNav").classList.remove ("activated");
    // Control the display page
    document.getElementById ("searchPage").classList.remove ("hidden");
    document.getElementById ("indexPage").classList.add ("hidden");

    setDefaultDates ();
}

function setDefaultDates () {
    let from = document.getElementById ("from");
    let to = document.getElementById ("to");
    from.defaultValue = getWeekAgo ();
    to.defaultValue = formatDate();

}

function formatDate () {
    let today = new Date();
    let dd = today.getDate ();
    let mm = today.getMonth () + 1;
    let yyyy = today.getFullYear ();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    return yyyy + '-' + mm + '-' + dd;
}

function getWeekAgo () {
    let today = new Date ();

    today.setDate (today.getDate () - 7);

    let dd = today.getDate ();
    let mm = today.getMonth () + 1;
    let yyyy = today.getFullYear ();

    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    return yyyy + '-' + mm + '-' + dd;
}

function newsOn () {
    // Control the nav bar
    document.getElementById ("newsNav").classList.add ("activated");
    document.getElementById ("searchNav").classList.remove ("activated");
    // Control the display page
    document.getElementById ("indexPage").classList.remove ("hidden");
    document.getElementById ("searchPage").classList.add ("hidden");
}

function indexPage () {
    var xmlHttp = new XMLHttpRequest ();
    xmlHttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            loadNews (this.responseText);
        }
    }
    xmlHttp.open ("GET", "/index", true);
    xmlHttp.send ()
}

function loadNews (responseText) {
    var jsonList = JSON.parse (responseText);
    var top = jsonList[0];
    var cnn = jsonList[1];
    var fox = jsonList[2];
    var word_cloud = jsonList[3];
    var sliding = document.getElementById ('headlines');
    showSlidingImgs (top, sliding);
    drawCloud (word_cloud);
    var cnn_wrapper = document.getElementById ('cnn');
    showNewsCards (cnn, cnn_wrapper);
    var fox_wrapper = document.getElementById ('fox');
    showNewsCards (fox, fox_wrapper);
}

function showNewsCards (data, pos) {
    var articles = data.articles;
    var cards = "";
    for (let article of articles) {
        cards += "<li><a href=\"" + article.url + "\" target='_blank'><div class=\"card\">";
        cards += "<img src=\"" + article.urlToImage + "\" class=\"card-img\">";
        cards += "<div class=\"card-title\">" + article.title + "</div>";
        cards += "<div class=\"card-description\">" + article.description + "</div>";
        cards += "</div></a></li>"
    }
    pos.innerHTML = cards;
}

function showSlidingImgs (data, pos) {
    var articles = data.articles;
    var imgs = "";
    for (let article of articles) {
        imgs += "<a class=\"sliding-img\" href=\"" + article.url + "\" target='_blank'>";
        imgs += "<img class=\"slides\" src=\"" + article.urlToImage + "\">";
        imgs += "<div class = \"label\">";
        imgs += "<div class=\"label-title\">" + article.title + "</div>";
        imgs += "<div class=\"label-descript\">" + article.description + "</div>";
        imgs += "</div>"
        imgs += "</a>"
    }
    pos.innerHTML = imgs;
    slidingEffect ();
}

var img_cnt = 0;

function slidingEffect () {
    var sliding_imgs = document.getElementsByClassName ("sliding-img");
    for (let i = 0; i < sliding_imgs.length; ++i) {
        sliding_imgs[i].style.display = "none";
    }
    var visible = img_cnt % 5;
    sliding_imgs[visible].style.display = "block";
    img_cnt++;
    setTimeout (slidingEffect, 2000);
}

function drawCloud (myWords) {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = 284 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select ("#word-cloud").append ("svg")
        .attr ("width", width + margin.left + margin.right)
        .attr ("height", height + margin.top + margin.bottom)
        .append ("g")
        .attr ("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
    // Wordcloud features that are different from one word to the other must be here
    var layout = d3.layout.cloud ()
        .size ([width, height])
        .words (myWords.map (function (d) {
            return {text: d.word, size: d.size};
        }))
        .padding (3)        //space between words
        .rotate (function () {
            return ~~(Math.random () * 2) * 90;
        })
        .fontSize (function (d) {
            return d.size + 8;
        })      // font size of words
        .on ("end", draw);
    layout.start ();

    // This function takes the output of 'layout' above and draw the words
    // Wordcloud features that are THE SAME from one word to the other can be here
    function draw (words) {
        svg
            .append ("g")
            .attr ("transform", "translate(" + layout.size ()[0] / 2 + "," + layout.size ()[1] / 2 + ")")
            .selectAll ("text")
            .data (words)
            .enter ().append ("text")
            .style ("font-size", function (d) {
                return d.size + "px";
            })
            .style ("fill", "black")
            .attr ("text-anchor", "middle")
            .style ("font-family", "Impact")
            .attr ("transform", function (d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text (function (d) {
                return d.text;
            });
    }
}

function submitForm () {
    var parent = document.getElementById ("news-search");
    parent.innerHTML = "";
    lenOfResults = 0;
    var form = document.getElementById ("searching");
    var from = form[1];
    var to = form[2];
    var from_date = new Date (from.value);
    var to_date = new Date (to.value);
    if (from_date.getTime () > to_date.getTime ()) {
        alert ("Incorrect time");
    } else {
        // Valid and search
        loadSearch (form);
    }
}


function loadSearch (form) {
    let xhp = new XMLHttpRequest ();
    let args = getSendData (form);
    let url = '/search' + args;
    xhp.open ('GET', url);
    xhp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            loadSearchResult (this.responseText);
        }
    };
    xhp.send ();
}

function getSendData (form) {
    let data = [];
    for (let i = 0; i < 5; ++i) {
        data.push (form[i].name + "=" + form[i].value);
    }
    return "?" + data.join ("&");
}

var lenOfResults = 0;

function loadSearchResult (data) {
    var response = JSON.parse (data);
    if (response.status === 'error') {
        alert (response.message);
    } else if (!response.hasResult) {
        showNoResult ();
    } else {
        showResults (response.articles.articles);
    }
}

function showNoResult () {
    var pos = document.getElementById ("news-search");
    var noresult = document.createElement ("p");
    noresult.setAttribute ("style", "text-align: center");
    noresult.innerHTML = "No Result";
    pos.appendChild (noresult);
}

function showResults (articles) {
    lenOfResults = articles.length;

    let parent = document.getElementById ("news-search");

    if (lenOfResults > 5) {
        for (let i = 0; i < lenOfResults; ++i) {
            let card_wrapper = document.createElement ("div");
            card_wrapper.setAttribute ("class", "card-wrappers");
            // Normal cards to display
            if (i > 4) {
                createNormalCards (card_wrapper, articles[i], true);
            } else {
                createNormalCards (card_wrapper, articles[i], false);
            }
            // Bigger cards to display
            createBiggerCards (card_wrapper, articles[i]);
            parent.appendChild (card_wrapper);
        }
        creatShowMoreBtn (parent);
        document.getElementById ("toggleBtn").addEventListener ("click", toggle);
    } else {
        for (let article of articles) {
            let card_wrapper = document.createElement ("div");
            card_wrapper.setAttribute ("class", "card-wrappers");
            // Normal cards to display
            createNormalCards (card_wrapper, article, false);
            // Bigger cards to display
            createBiggerCards (card_wrapper, article);
            parent.appendChild (card_wrapper);
        }
    }
}


function toggle () {
    let btn = document.getElementById ("toggleBtn");
    if (btn.classList.contains ('more')) {
        showMore (btn)
    } else {
        showLess (btn);
    }
}

function showMore (target) {
    target.classList.remove ("more");
    target.classList.add ("less");
    target.innerHTML = "Show Less";
    let cards = document.getElementsByClassName ("result-cards");
    for (let i = 5; i < lenOfResults; ++i) {
        cards[i].classList.remove ("hidden");
    }
}

function showLess (target) {
    target.classList.remove ("less");
    target.classList.add ("more");
    target.innerHTML = "Show More";
    let cards = document.getElementsByClassName ("result-cards");
    for (let i = 5; i < lenOfResults; ++i) {
        cards[i].classList.add ("hidden");
    }
}

function creatShowMoreBtn (parent) {
    var button = document.createElement ("div");
    var showMore = document.createElement ("button");
    showMore.innerHTML = "Show More";
    showMore.setAttribute ("class", "more");
    showMore.setAttribute ("id", "toggleBtn")
    button.appendChild (showMore);
    button.style = "text-align: center; margin-top: 20px;";
    parent.appendChild (button);
}


function createNormalCards (parentNode, article, needHidden) {
    let card = document.createElement ("div");
    if (needHidden) {
        card.setAttribute ("class", "result-cards hidden");
    } else {
        card.setAttribute ("class", "result-cards");
    }

    let img = document.createElement ("img");
    img.setAttribute ("src", article.urlToImage);

    let text = document.createElement ("div");
    text.setAttribute ("class", "text");

    let title = document.createElement ("p");
    title.setAttribute ("class", "result-titles");
    title.innerHTML = article.title;

    let description = document.createElement ("p");
    description.setAttribute ("class", "result-descriptions");
    let des = article.description;
    des = des.substr (0, 70);
    description.innerHTML = des.substr (0, Math.min (70, des.lastIndexOf (" "))) + "...";

    text.appendChild (title);
    text.appendChild (description);

    card.appendChild (img);
    card.appendChild (text);

    parentNode.appendChild (card);
    card.addEventListener ("click", function (event) {
        parentNode.childNodes[1].classList.remove ("hidden");
        this.classList.add ("hidden");
    });
}

function createBiggerCards (parentNode, article) {
    let card = document.createElement ("div");
    card.setAttribute ("class", "bigger-cards hidden");

    let img = document.createElement ("img");
    img.setAttribute ("src", article.urlToImage);

    let text = document.createElement ("div");
    text.setAttribute ("class", "text");

    let title = document.createElement ("p");
    title.innerHTML = "<strong>" + article.title + "</strong>";

    let author = document.createElement ("p");
    author.innerHTML = "<strong> Author: </strong>" + article.author;

    let source = document.createElement ("p");
    source.innerHTML = "<strong> Source: </strong>" + article.source.name;

    let date = document.createElement ("p");
    let dateList = article.publishedAt.substr (0, 10).split ("-");
    date.innerHTML = "<strong> Date: </strong>" + dateList[1] + "/" + dateList[2] + "/" + dateList[0];

    let description = document.createElement ("p");
    description.innerHTML = article.description;

    let origin = document.createElement ("a");
    origin.setAttribute ("href", article.url);
    origin.setAttribute ("target", "_blank");
    origin.innerHTML = "See Original Post";

    let close = document.createElement ("span");
    close.innerHTML = '&#215';
    close.setAttribute ("class", "close")

    author.setAttribute ("class", "bigger-text");
    source.setAttribute ("class", "bigger-text");
    date.setAttribute ("class", "bigger-text");
    description.setAttribute ("class", "bigger-text");
    description.setAttribute ("class", "bigger-text");

    text.appendChild (title);
    text.appendChild (author);
    text.appendChild (source);
    text.appendChild (date);
    text.appendChild (description);
    text.appendChild (origin);

    card.appendChild (img);
    card.appendChild (text);
    card.appendChild (close);
    parentNode.appendChild (card);

    close.addEventListener ("click", function () {
        parentNode.childNodes[1].classList.add ("hidden");
        parentNode.childNodes[0].classList.remove ("hidden");
    })
}