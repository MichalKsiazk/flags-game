/* send call to api and return response */
async function sendAPICall(url)
{
    const countries = await fetch(url, {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return countries.json();
}

/* auto scroll page to next flag when answer is correct */
function setAutoFocus(last_flag_id)
{
    var next_id = parseInt(last_flag_id.substring(1,3)) + 1;
    next_id = next_id.toString();
    var new_id = "";
    new_id = new_id.concat("t", next_id);

    var last_id = document.getElementById("game").getAttribute("max_t");

    /* check if previous answer is the last */
    if(last_flag_id == last_id) 
    {
        return;
    }

    var next_input = document.getElementById(new_id);   

    /* recursively search next empty answers to skip filled answers */
    if(next_input == null || next_input.readOnly)
    {
        setAutoFocus(new_id);
    }
    else
    {
        next_input.focus();
    }
}


/* all answers must be converted to latin alphabet and uppercase to avoid cases like "S?o Tom� and Pr�ncipe" */

/* return string in latin alphabet */
function normalizeDiacritics(str)
{
    var new_str = str;
    new_str = new_str.normalize("NFD").replace(/\p{Diacritic}/gu, "");

    /* replace polish letters */
    new_str = new_str.normalize("NFD").replace(/\u0141/g, "L");
    return new_str;
}


/* give player a point */
function addScore(s)
{

    /* check if game should be stopped */
    var game = document.getElementById("game");
    if(game.getAttribute("state") == "halted")
    {
        return;
    }

    var score = document.getElementById("score");
    var new_score = parseInt(score.innerHTML) + s;
    var max_score = parseInt(document.getElementById("max_score").innerHTML);
    score.innerHTML = new_score;
    document.getElementById("ping").play();

    /* stop the game if player answered all flags */
    if(new_score >= max_score)
    {
        stopGame(true);
    }

}

/* compare player answer with correct answer */
function isAnswerCorrect(user_answer, correct_answer)
{
    var user = normalizeDiacritics(user_answer.toUpperCase());
    var correct = normalizeDiacritics(correct_answer.toUpperCase());
    if(user == correct)
    {
        return true;
    }
    return false;
}

/* function called every time user changes a input value */
function onPropertyChange(text_field_name)
{
    var user_input = document.getElementById(text_field_name);
    var parent_node = user_input.parentElement;


    /* check if aswer is correct */
    var correct = isAnswerCorrect(user_input.value, parent_node.id);

    /* check if player answer is correct */
    if(correct)
    {
        /* change flag panel color to green */
        parent_node.style.backgroundColor = "#71da71";
        user_input.style.backgroundColor = "#9ae59a";

        /* change player answer to more estetic version e.g. wegry => W�gry */
        var correct_answer = parent_node.querySelector("strong").innerHTML;
        user_input.value = correct_answer;

        /* disable input panel to avoid multiple answers for same flag */
        user_input.readOnly = true;
        /* scroll page to next answer */
        setAutoFocus(text_field_name);
        /* give player a point */
        addScore(1);
    }
}

/* generate ui component from json element */
function generateCountryComponent(country_name, flag, index)
{

    var country_div = document.createElement('div');
    var img = document.createElement('img');
    var name = document.createElement('strong');
    var text_field = document.createElement("textarea");

    var t_id = "";
    t_id = t_id.concat("t", index);

    var onc = "";
    document.getElementById("game").setAttribute("max_t", t_id);
    onc = onc.concat("onPropertyChange('", t_id,"')");
    text_field.setAttribute("onkeyup", onc);
    //text_field.style.float = "none";
    text_field.id = t_id;
    text_field.classList.add("text_input");
    text_field.hidden = true;

    img.style.width = "100%";
    name.innerHTML = country_name;
    name.className = "name";
    name.hidden = true;
    img.src = flag;
    img.className = "flag";
    country_div.id = country_name;
    country_div.classList.add("flag_in_holder");
    img.title = country_name;
    country_div.appendChild(img);
    country_div.appendChild(name);
    country_div.appendChild(document.createElement('br'));
    country_div.appendChild(text_field);
    holder.appendChild(country_div);
}

/* show timer value in minutes */
function setTime()
{
    var time = parseInt(document.getElementById("actual_time").innerHTML);
    var minutes = Math.floor(time / 60);
    var seconds = (time) - minutes * 60;
    document.getElementById("time_val").innerHTML = minutes.toString() + ":" + seconds.toString();
}

function setInfoLabels(count)
{
    document.getElementById("max_score").innerHTML = count;
    document.getElementById("actual_time").innerHTML = count * 4;
    setTime()
    
}

/* function handling game timer */
function timer()
{

    var time = document.getElementById("actual_time");
    time.innerHTML = parseInt(time.innerHTML) - 1;

    setTime();

    /* stop game if time has elapsed */
    if(parseInt(time.innerHTML) <= 0)
    {
        stopGame(false);
    }

}

/* generate ui components from json */
function generateComponentsFromResponse(response)
{
    var count = 0;
    var holder = document.getElementById("holder");
    response.then((data) => {
        for(var i = 0; i < Object.keys(data).length; i++)
        {
            /* check if country is independent, discard all dependent territories e.g. Faroe Islands, Gibraltar */
            if(!data[i].independent)
            {
                continue;
            }

            var lang = getLang(data[i]);

            generateCountryComponent(lang, data[i].flags.png, i);
            count++;
        }
        var l = holder.querySelector("b");
        if(l != null)
        {
            l.remove();
        }
        //renameCountries();
        setInfoLabels(count);

        var play_button = document.getElementById("play_button");
        play_button.disabled = false;
    })
}


/* to refactor */
function getLang(element)
{
    if(document.getElementById("pl").classList.contains("pressed"))
    {
        return element.translations.pol.common;
    }
    else if(document.getElementById("eng").classList.contains("pressed"))
    {
        return element.name.common;
    }
}

/* change game language and reload api call */
function setLang(lang)
{
    console.log(lang);
    if(lang == "pl")
    {
        document.getElementById("pl").classList.add("pressed");
        document.getElementById("eng").classList.remove("pressed");
    }
    else if(lang == "eng")
    {
        document.getElementById("eng").classList.add("pressed");
        document.getElementById("pl").classList.remove("pressed");
    }
    var region = document.getElementsByClassName("mode_btn pressed");
    region[0].onclick();
}

/* rename unusual names */
function renameCountries()
{
    var uk = document.getElementById("Zjednoczone Kr�lestwo");
    uk.querySelector(".name").innerHTML = "Wielka Brytania";
    uk.id = "Wielka Brytania";
}

/* set flags region world, europe etc */
function setRegion(region, id)
{

    var other_btns = document.getElementsByClassName("mode_btn pressed");
    other_btns[0].classList.remove("pressed");
    var btn = document.getElementById(id).classList.add("pressed");
    resetHolder(region);
}

/* reset main menu flag holder */
function resetHolder(region)
{
    var holder = document.getElementById("holder");
    holder.innerHTML = '<b>LOADING...</b>';


    var play_button = document.getElementById("play_button");
    play_button.disabled = true;

    const response = sendAPICall("https://restcountries.com/v3.1/" + region);
    console.log(response);
    generateComponentsFromResponse(response);
}

/* init game */
function init()
{
    resetHolder("region/europe");
}

/* change color to red and block empty answers */
function disableIncorrectAnswers()
{
    var flags = game.childNodes;

    for(var i = 0; i < flags.length; i++) 
    {
        var input = flags[i].querySelector("textarea");
        if(input != null && !input.readOnly)
        {
            var correct_name = flags[i].querySelector("strong").innerHTML;
            input.value = correct_name;
            input.style.backgroundColor = "#ffff99";
            input.readOnly = true;
            flags[i].style.backgroundColor = "#dd7373";
            input.style.backgroundColor = "#ebadad";
        }
    }
}

/* function called after pressing resign button */
function resignGame()
{
    stopGame(false);
}

/* stop game */
function stopGame(win)
{
    document.getElementById("resign_button").hidden = true;
    document.getElementById("reset_button").hidden = false;
    console.log("GAME STOPPED");
    clearInterval(document.getElementById("actual_time").getAttribute("timer_id"));

    var game = document.getElementById("game");
    game.setAttribute("state", "halted");
    disableIncorrectAnswers();

}

/* reset game */
function resetGame()
{
    var menu = document.getElementById("game_menu");
    var holder = document.getElementById("holder");
    var info = document.getElementById("info");
    document.getElementById("col2").appendChild(info);
    var flags = document.getElementById("game").childNodes;
    holder.hidden = false;
    menu.hidden = false;
    document.getElementById("game").hidden = true;

    info.classList.remove("sticky_info_label");
    info.classList.add("info_label");
    
    while(flags.length > 0) 
    {
        flags[0].classList.add("flag_in_holder");
        flags[0].classList.remove("flag_in_game");
        var img = flags[0].querySelector("img");
        img.style.width = "100%";
        img.title = "";
        img.classList.remove("img_format");
        var text_field = flags[0].querySelector("textarea");
        text_field.value = "";
        text_field.hidden = true;
        holder.appendChild(flags[0]);
    }
}

/* function called after pressing start button */
function runGame()
{
    var game = document.getElementById("game");
    var holder = document.getElementById("holder");
    var flags = document.getElementById("holder").childNodes;

    var info = document.getElementById("info");

    document.getElementById("main").appendChild(info);
    info.classList.remove("info_label");
    info.classList.add("sticky_info_label");
    while(flags.length > 0) 
    {
        var img = flags[0].querySelector("img");
        img.style.width = "65%";
        img.title = "";
        img.classList.add("img_format");
        var text_field = flags[0].querySelector("textarea");
        text_field.hidden = false;
        game.appendChild(flags[0]).className = "flag_in_game";
    }
    //document.getElementById("t0").focus();
    document.getElementById("game_menu").hidden = true;
    document.getElementById("game").hidden = false;
    document.getElementById("holder").hidden = true;
    document.getElementById("resign_button").hidden = false;
    
    var timer_id = setInterval(timer, 1000);
    document.getElementById("actual_time").setAttribute("timer_id", timer_id.toString());
}
