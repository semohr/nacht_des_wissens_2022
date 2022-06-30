import fs from 'fs';
import useTranslation from 'next-translate/useTranslation';
import path from "path";




var candidates_en = [];
var candidates_de = [];
function set_canidates() {
    const name_data_en = fs.readFileSync("locales/en/teamnames.json");
    const names_en = JSON.parse(name_data_en.toString());

    for (let letter of Object.keys(names_en["animals"])) {
        let animals = names_en["animals"][letter];
        let adjectives = names_en["adjectives"][letter];

        // All combinations of adjectives and animals
        animals.forEach(animal => {
            adjectives.forEach(adjective => {
                candidates_en.push(adjective + animal);
            });
        });
    }

    const name_data_de = fs.readFileSync("locales/de/teamnames.json");
    const names_de = JSON.parse(name_data_de.toString());

    for (let letter of Object.keys(names_de["animals"])) {
        let animals = names_de["animals"][letter];
        let adjectives = names_de["adjectives"][letter];

        // All combinations of adjectives and animals
        animals.forEach(animal => {
            adjectives.forEach(adjective => {
                candidates_de.push(adjective + animal);
            });
        });
    }

}

// Get new random Team Name which was never used before
export default async function getTeamname(req, res) {

    var language = req.query.language;
    if (!language) {
        language = "en"
    }


    // Set canidates if not set yet
    if (candidates_en.length == 0) {
        set_canidates();
    }
    // Get all candiates by language
    var candidates;
    if (language == "de") {
        candidates = candidates_de
    } else if (language == "en") {
        candidates = candidates_en
    }
    else {
        console.log("Language not supported")
        candidates = candidates_en
    }


    const team_names = getUsedTeamnames();

    //console.log(candidates.length + " possible teamnames");
    const get_random_teamname = () => {
        const team_name = get_random(candidates);
        // Check if team name already exists
        if (team_names.includes(team_name)) {
            return get_random_teamname()
        }
        return team_name;
    }

    const random_team_name = get_random_teamname();
    res.json({ team_name: random_team_name })
}

// Get random entry from list
function get_random(list) {
    return list[Math.floor((Math.random() * list.length))];
}

// Get all already used names, such that we don't regenerate them
export function getUsedTeamnames() {
    var teamnames = [];
    // Get all json files
    const jsonsInDir = fs.readdirSync('public/experiments/').filter(file => path.extname(file) === '.json');

    jsonsInDir.forEach(file => {
        const fileData = fs.readFileSync(path.join('public/experiments', file));
        const json = JSON.parse(fileData.toString());
        teamnames.push(json.team_name);
    });
    return teamnames;
}
