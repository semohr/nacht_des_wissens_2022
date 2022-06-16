import fs from 'fs';
import path from "path";




var candidates = [];

function set_canidates() {
    const name_data = fs.readFileSync("locales/en/teamnames.json");
    const names = JSON.parse(name_data.toString());

    for (let letter of Object.keys(names["animals"])) {
        let animals = names["animals"][letter];
        let adjectives = names["adjectives"][letter];
        //console.log(letter);
        //console.log(animals);
        //console.log(adjectives);
        // All combinations of adjectives and animals
        animals.forEach(animal => {
            adjectives.forEach(adjective => {
                candidates.push(adjective + animal);
            });
        });
    }

}

// Get new random Team Name which was never used before
export default async function getTeamname(req, res) {

    // Set canidates if not set yet
    if (candidates.length == 0) {
        set_canidates();
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
function getUsedTeamnames() {
    var teamnames = [];
    // Get all json files
    const jsonsInDir = fs.readdirSync('public/experiments/').filter(file => path.extname(file) === '.json');

    jsonsInDir.forEach(file => {
        const fileData = fs.readFileSync(path.join('public/experiments', file));
        const json = JSON.parse(fileData.toString());
        teamnames.push(json.teamname);
    });
    return teamnames;
}
