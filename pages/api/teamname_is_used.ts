import { getUsedTeamnames } from "./teamname";

export default function isUsed(req, res){
    const { teamname } = req.query; // parses ?teamname=xxxx
    console.log({teamname});
    const team_names = getUsedTeamnames();
    console.log(team_names);
    if (team_names.includes(teamname)){
        res.json({used: true});
    } else {
        res.json({used: false});
    }
}
