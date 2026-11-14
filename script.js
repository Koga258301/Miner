const MIN_MINING = 50; // 採掘量の下限
const MAX_MINING = 130; // 採掘量の上限
const MAX_STOCK = 10;  // 備蓄の上限
const LEADER_MAX_MINE = 1; // リーダーの採掘可能回数
const MAX_NAME_LENGTH = 4; // 名前の長さ

// 以下、採掘確率
const MINING_ROLLS = 40;

const LOW_RATE = 0.59;
const MID_RATE = 0.02;

const LOW_REWARD = 1;
const MID_REWARD = 4;
const HIGH_REWARD = 5;
// 以上、採掘確率


// プレイヤー一覧
const players = [
    {
        name: "プレイヤー1",
        role: "リーダー",
        stock: 0,
        mineCount: 0
    },
    {
        name: "プレイヤー2",
        role: "採掘者A",
        stock: 0,
        mineCount: 0
    },
    {
        name: "プレイヤー3",
        role: "採掘者B",
        stock: 0,
        mineCount: 0
    },
    {
        name: "プレイヤー4",
        role: "採掘者C",
        stock: 0,
        mineCount: 0
    },
    {
        name: "プレイヤー5",
        role: "盗賊",
        stock: 0,
        mineCount: 0
    },
    {
        name: "プレイヤー6",
        role: "共犯者",
        stock: 0,
        mineCount: 0
    }
];
// 役職一覧
const roles = [
    "リーダー",
    "採掘者A",
    "採掘者B",
    "採掘者C",
    "盗賊",
    "共犯者"
];

let round = 1;

let citizenWins = 0;
let thiefWins = 0;

let gameStarted = false;
let gameOver = false;

let roleCheckComplete = false;
let meetingInProgress = false;

// 共犯の能力用
let accompliceUsed = false;  
let accompliceChanging = false;

// 採掘中の処理用
let miningPlayers = [];
let miningIndex = 0;
let miningAmounts = [];
let currentMiningAmount = 0;
let deliveryAmounts = [];

let miningHistory = [];

// 会議の時間などの管理用
let meetingTime = 300;
let meetingTimer = null;

let revealPlayerIndex = 0;

// 採掘の基本確率
function rollBase() {

    let total = 0;

    for(let i = 0; i < MINING_ROLLS; i++) {

        let r = Math.random();

        if(r < LOW_RATE) {

            total += LOW_REWARD;

        }
        else if(r < LOW_RATE + MID_RATE) {

            total += MID_REWARD;

        }
        else {

            total += HIGH_REWARD;

        }

    }

    return total;

}
// 役職ごとの採掘確率
function getMiningAmount(role) {

    let amount = rollBase();

    if(role === "採掘者A") {
        amount += 2;
    }
    else if(role === "採掘者C") {
        amount -= 2;
    }
    else if(role === "リーダー") {
        amount += 5;
    }
    else if(role === "盗賊") {
        amount += 15;
    }
    else if(role === "共犯者") {
        amount += 15;
    }
if(amount < MIN_MINING) {
    amount = MIN_MINING;
}
if(amount > MAX_MINING) {
    amount = MAX_MINING;
}
    return amount;

}
function getDisplayRole(role) {

    if(
        role === "採掘者A" ||
        role === "採掘者B" ||
        role === "採掘者C"
    ) {

        return "採掘者";

    }

    return role;

}
// 採掘開始
function mining() {

    if(meetingInProgress) {

    alert("会議を終了してください");

    return;

}

    if(!gameStarted) {

        alert("先にゲーム開始を押してください");

        return;

    }
    if(!roleCheckComplete) {

    alert("全員の役職確認を完了してください");

    return;

    }

    if(gameOver) {

        alert("ゲームは終了しています");

        return;

    }
    

    let selectedPlayers = [];

    for(let i = 0; i < players.length; i++) {

        let checkbox =
            document.getElementById("p" + i);

        if(checkbox.checked) {
            selectedPlayers.push(players[i]);
        }

    }

    if(selectedPlayers.length !== 3) {

        alert("3人選んでください");

        return;

    }
    document.getElementById("mineButton").style.display =
    "none";

    miningPlayers = selectedPlayers;

miningIndex = 0;

miningAmounts = [];

showMiningPlayer();

return;
    
    document.getElementById("meetingDisplay").innerHTML = "";
    document.getElementById("meetingDisplay").innerHTML =
        "";

    document.getElementById("accompliceDisplay").innerHTML =
        "";

    document.getElementById("selectionArea").style.display =
    "none";

    console.log(selectedPlayers);

    let selectedText = "";

    let sum = 0;

    let miningText = "";

    for(let i = 0; i < selectedPlayers.length; i++) {

    selectedPlayers[i].mineCount++;

    let amount =
        getMiningAmount(
            selectedPlayers[i].role
        );

    sum += amount;

    miningText +=
        selectedPlayers[i].name +
        " : " +
        amount +
        "個<br>";

}

    for(let i = 0; i < selectedPlayers.length; i++) {

    selectedText +=
        selectedPlayers[i].name +
        " : " +
        selectedPlayers[i].role +
        "<br>";

}

    let result;

    if(sum >= 300){
        result = "成功！";
        citizenWins++;
    } else {
        result = "失敗...";
        thiefWins++;
    }
    document.getElementById("scoreDisplay").innerHTML =
    "市民 " +
    citizenWins +
    "勝　盗賊 " +
    thiefWins +
    "勝";

    if(citizenWins >= 5) {

    let everyoneMined = true;

    let missingPlayers = "";

    for(let i = 0; i < players.length; i++) {

        if(players[i].mineCount === 0) {

            everyoneMined = false;

            missingPlayers +=
                players[i].name +
                "<br>";

        }

    }

    gameOver = true;

    if(everyoneMined) {

        document.getElementById("result").innerHTML =
            "<h1>市民陣営の勝利！</h1>" +
            "<h2>最終スコア</h2>" +
            "<p>市民 5勝　盗賊 " +
            thiefWins +
            "勝</p>";

    }
    else {

        document.getElementById("result").innerHTML =
            "<h1>盗賊陣営の勝利！</h1>" +
            "<p>未採掘プレイヤー</p>" +
            missingPlayers +
            "<br>" +
            "<h2>最終スコア</h2>" +
            "<p>市民 5勝　盗賊 " +
            thiefWins +
            "勝</p>";

    }

    return;

}


if(thiefWins >= 5) {

    gameOver = true;

    document.getElementById("result").innerHTML =
    "<h1>盗賊陣営の勝利！</h1>" +
    "<h2>最終スコア</h2>" +
    "<p>市民 " +
    citizenWins +
    "勝　盗賊 5勝</p>";

    return;

}
if(round >= 9) {

    gameOver = true;

    if(citizenWins > thiefWins) {

        alert(
            "9ラウンド終了\n市民陣営の勝利！"
        );

    }
    else if(thiefWins > citizenWins) {

        alert(
            "9ラウンド終了\n盗賊陣営の勝利！"
        );

    }
    else {

        alert(
            "9ラウンド終了\n引き分け"
        );

    }

    return;

}

    let playerList = "";

for(let i = 0; i < players.length; i++) {
    playerList +=
    players[i].name +
    " : " +
    players[i].role +
    " (採掘回数 " +
    players[i].mineCount +
    ")" +
    "<br>";
}
document.getElementById("result").innerHTML =
    miningText +
    "<br>" +
    "合計: " + sum + "個<br><br>" +
    result +
    "<br><br>" +
    "プレイヤー一覧<br>" +
    playerList +
    "<br><br>" +
    "選出メンバー<br>" +
    selectedText;

round++;

document.getElementById("roundDisplay").innerHTML =
    "Round " + round;

    document.getElementById("scoreDisplay").innerHTML =
    "市民 " +
    citizenWins +
    "勝　盗賊 " +
    thiefWins +
    "勝";

    for(let i = 0; i < players.length; i++) {
    document.getElementById("p" + i).checked = false;
}
    document.getElementById("mineButton").style.display =
    "none";

    document.getElementById("nextRoundButton").style.display =
    "inline-block";

    for(let i = 0; i < players.length; i++) {
    document.getElementById("p" + i).checked = false;
}

document.getElementById("mineButton").style.display =
    "none";

document.getElementById("nextRoundButton").style.display =
    "inline-block";

}


function shuffle(array) {

    for(let i = array.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;

    }

}
function startGame() {

    for(let i = 0; i < players.length; i++) {

    let inputName =

        document.getElementById("name" + i).value;

    if(inputName !== "") {

    if(inputName.length > MAX_NAME_LENGTH) {

        alert(
            "プレイヤー名は" +
            MAX_NAME_LENGTH +
            "文字以内で入力してください"
        );

        return;

    }

    players[i].name = inputName;

}

}

    showPlayers();

    setupGame();

    gameStarted = true;
    gameOver = false;
    roleCheckComplete = false;

    document.getElementById("ruleBookButton").style.display =
    "none";
    document.getElementById("roundDisplay").style.display =
    "block";
    document.getElementById("scoreDisplay").style.display =
    "block";

    document.getElementById("startButton").style.display =
    "none";
    document.getElementById("playerNameArea").style.display =
    "none";
    document.getElementById("roleButton").style.display = "inline-block";

}
function showPlayers() {

    let html = "";

    for(let i = 0; i < players.length; i++) {

        html +=
            '<input type="checkbox" id="p' + i + '">' +
            players[i].name +
            '<br>';

    }

    document.getElementById("playerSelect").innerHTML = html;

    document.getElementById("roundDisplay").style.display =
    "none";
    document.getElementById("scoreDisplay").style.display =
    "none";

    document.getElementById("roleButton").style.display = "none";
    document.getElementById("meetingButton").style.display = "none";
    document.getElementById("endMeetingButton").style.display = "none";
    document.getElementById("mineButton").style.display = "none";
    document.getElementById("nextRoundButton").style.display = "none";
    document.getElementById("selectDoneButton").style.display =
    "none";

    document.getElementById("selectionArea").style.display =
    "none";

}
function setupGame() {

    shuffle(roles);

    for(let i = 0; i < players.length; i++) {
        players[i].role = roles[i];
    }

}
showPlayers();
// ゲームのリセット
function resetGame() {
    

    gameStarted = false;
    gameOver = false;
    roleCheckComplete = false;
    accompliceUsed = false;

    clearInterval(meetingTimer);

    meetingInProgress = false;
    meetingTime = 300;

    revealPlayerIndex = 0;

    round = 1;

    citizenWins = 0;
    thiefWins = 0;

    miningPlayers = [];
    miningAmounts = [];
    deliveryAmounts = [];
    miningHistory = [];

    for(let i = 0; i < players.length; i++) {

        players[i].mineCount = 0;

        players[i].stock = 0;

        players[i].name =
        "プレイヤー" + (i + 1);

        document.getElementById("name" + i).value = "";

        let checkbox =
    document.getElementById("p" + i);

if(checkbox) {

    checkbox.checked = false;

}

    }

    document.getElementById("roundDisplay").innerHTML =
        "Round 1";

    document.getElementById("scoreDisplay").innerHTML =
        "市民 0勝　盗賊 0勝";

    document.getElementById("roundDisplay").style.display =
        "none";

    document.getElementById("scoreDisplay").style.display =
        "none";

    document.getElementById("roleButton").style.display =
        "none";

    document.getElementById("meetingButton").style.display =
        "none";

    document.getElementById("endMeetingButton").style.display =
        "none";

    document.getElementById("mineButton").style.display =
        "none";

    document.getElementById("nextRoundButton").style.display =
        "none";

    document.getElementById("startButton").style.display =
        "inline-block";

    document.getElementById("ruleBookButton").style.display =
        "inline-block";

    document.getElementById("playerNameArea").style.display =
        "block";

    document.getElementById("result").innerHTML = "";

    document.getElementById("roleDisplay").innerHTML = "";

    document.getElementById("meetingDisplay").innerHTML = "";

    document.getElementById("accompliceDisplay").innerHTML = "";

    document.getElementById("historyDisplay").innerHTML = "";

}
function showRole() {

    document.getElementById("roleButton").style.display =
        "none";

    if(!gameStarted) {

        alert("先にゲーム開始してください");

        return;

    }

    if(revealPlayerIndex >= players.length) {

    roleCheckComplete = true;

    document.getElementById("roleButton").style.display =
        "none";

    document.getElementById("meetingButton").style.display =
        "inline-block";



    document.getElementById("roleDisplay").innerHTML =
        "全員確認済みです<br><br>会議を開始してください";

    return;

}

    document.getElementById("roleDisplay").innerHTML =
        players[revealPlayerIndex].name +
        "<br><br>" +
        "スマホを受け取ってください<br><br>" +
        "<button onclick='revealRole()'>役職を見る</button>";

}
function revealRole() {

    let buttonText = "確認した";

    if(revealPlayerIndex === players.length - 1) {
        buttonText = "役職確認を終了する";
    }

    let displayRole = getDisplayRole(
        players[revealPlayerIndex].role
    );

    let roleText =

        "あなたの役職は<br><br>" +

        displayRole;

    if(players[revealPlayerIndex].role === "盗賊") {

        let accompliceName = "";

        for(let i = 0; i < players.length; i++) {

            if(players[i].role === "共犯者") {

                accompliceName =
                    players[i].name;

            }

        }

        roleText +=

            "<br><br>" +

            "共犯者は<br><br>" +

            accompliceName +

            "です";

    }

    document.getElementById("roleDisplay").innerHTML =

        roleText +

        "<br><br>" +

        "<button onclick='nextPlayer()'>" +

        buttonText +

        "</button>";

}
function nextPlayer() {

    revealPlayerIndex++;

    showRole();

}
function startMeeting() {

    document.getElementById("meetingButton").style.display = "none";
    document.getElementById("endMeetingButton").style.display =
    "inline-block";
    document.getElementById("roleDisplay").innerHTML =
        "";
    if(!roleCheckComplete) {

        alert("先に全員の役職確認を完了してください");

        return;

    }

    meetingInProgress = true;

    meetingTime = 300;

    updateMeetingDisplay();

    meetingTimer = setInterval(function() {

        meetingTime--;

        updateMeetingDisplay();

        if(meetingTime <= 0) {

            endMeeting();

        }

    }, 1000);

}
function endMeeting() {

    meetingInProgress = false;

    clearInterval(meetingTimer);

    document.getElementById("meetingDisplay").innerHTML =
        "<h2>リーダーは採掘メンバーを選出してください</h2>";

    document.getElementById("endMeetingButton").style.display =
        "none";
    document.getElementById("selectDoneButton").style.display =
        "inline-block";

        document.getElementById("selectionArea").style.display =
    "block";

}

function updateMeetingDisplay() {

    let minutes =
        Math.floor(meetingTime / 60);

    let seconds =
        meetingTime % 60;

    if(seconds < 10) {

        seconds = "0" + seconds;

    }

    document.getElementById("meetingDisplay").innerHTML =
        "<h2>会議中</h2>" +
        "<h3>残り " +
        minutes +
        ":" +
        seconds +
        "</h3>";

}
function nextRound() {

    miningPlayers = [];
    miningAmounts = [];
    deliveryAmounts = [];

    round++;

document.getElementById("roundDisplay").innerHTML =

    "Round " +
    round;

    document.getElementById("nextRoundButton")
        .style.display = "none";

    document.getElementById("meetingButton")
        .style.display = "inline-block";

    document.getElementById("meetingDisplay").innerHTML =
        "";
    document.getElementById("accompliceDisplay").innerHTML =
    "";
    document.getElementById("result").innerHTML =
    "";   

}

// 共犯者の能力関係1
function useAccomplice() {

    accompliceUsed = true;
    accompliceChanging = true;

    document.getElementById("selectionArea").style.display =
    "block";

    document.getElementById("accompliceDisplay").innerHTML =
        "<h3>共犯者は採掘メンバーを選んでください</h3>";

    document.getElementById("selectDoneButton").style.display =
        "inline-block";

}
// 共犯者の能力関係2
function skipAccomplice() {

    showFinalMembers();

}
function finishSelection() {

    let checkedCount = 0;

    for(let i = 0; i < players.length; i++) {

        if(document.getElementById("p" + i).checked) {
            checkedCount++;
        }

    }

    if(checkedCount !== 3) {

        alert("採掘メンバーは3人選んでください");

        return;

    }
    for(let i = 0; i < players.length; i++) {

    let checkbox =
        document.getElementById("p" + i);

    if(
        checkbox.checked &&
        players[i].role === "リーダー" &&
        players[i].mineCount >= LEADER_MAX_MINE
    ) {

        alert(
            "リーダーはこれ以上採掘できません"
        );

        return;

    }

}
    if(accompliceChanging) {

    accompliceChanging = false;

    document.getElementById("selectDoneButton").style.display =
        "none";

    showFinalMembers();

    return;

    }


    document.getElementById("selectDoneButton").style.display =
        "none";

    document.getElementById("meetingDisplay").innerHTML =
        "";
        document.getElementById("selectionArea").style.display =
    "none";

    if(!accompliceUsed) {

        document.getElementById("accompliceDisplay").innerHTML =
            "<h3>共犯者はメンバーを変更しますか？</h3>" +
            "<button onclick='useAccomplice()'>変更する</button>" +
            "<button onclick='skipAccomplice()'>しない</button>";

    }
    else {

    showFinalMembers();

}

}

function showFinalMembers() {

    let memberList = "";

    for(let i = 0; i < players.length; i++) {

        let checkbox =
            document.getElementById("p" + i);

        if(checkbox.checked) {

            memberList +=
                players[i].name +
                "<br>";

        }

    }

    document.getElementById("selectionArea").style.display =
        "none";

    document.getElementById("accompliceDisplay").innerHTML =
        "<h3>最終採掘メンバー</h3>" +
        memberList;

    document.getElementById("mineButton").style.display =
        "inline-block";

}
function showMiningPlayer() {

    let player =
        miningPlayers[miningIndex];

    document.getElementById("result").innerHTML =

        "<h2>" +
        player.name +
        "の採掘</h2>" +

        "<button onclick='mineOnePlayer()'>" +
        "採掘する" +
        "</button>";

}
function mineOnePlayer() {

    let player =
        miningPlayers[miningIndex];

    player.mineCount++;

    currentMiningAmount =
        getMiningAmount(player.role);

    miningAmounts.push({

        player: player,

        amount: currentMiningAmount

    });

    document.getElementById("result").innerHTML =

    "<h2>" +
    player.name +
    "</h2>" +

    "<h3>採掘量：" +
    currentMiningAmount +
    "個</h3>" +

    "<h3>現在の備蓄：" +
    player.stock +
    "個</h3>" +


    "<p>納品可能範囲<br>" +
    "50～" +
    (currentMiningAmount + player.stock) +
    "個</p>" +


    "<input type='number' id='deliveryInput'>" +

    "<br><br>" +

    "<button onclick='confirmDelivery()'>" +
    "決定" +
    "</button>";

}
function confirmDelivery() {

    let player =
    miningPlayers[miningIndex];

    let delivery = Number(
        document.getElementById("deliveryInput").value
    );

    if(
        delivery < 50 ||
        delivery > currentMiningAmount + player.stock
    ) {

        alert(
            "納品量は50～" +
            (currentMiningAmount + player.stock) +
            "の範囲で入力してください"
        );

        return;

    }

    deliveryAmounts.push(delivery);

    let newStock =

    currentMiningAmount +

    player.stock -

    delivery;
    if(newStock > MAX_STOCK) {

    newStock = MAX_STOCK;

}
player.stock = newStock;

    document.getElementById("result").innerHTML =

    "<h3>納品量：" +
    delivery +
    "個</h3>" +

    "<h3>現在の備蓄：" +
    player.stock +
    "個</h3>" +

    "<button onclick='confirmMining()'>" +
    "確認" +
    "</button>";

}
function confirmMining() {

    let nextIndex =
        miningIndex + 1;

    if(nextIndex < miningPlayers.length) {

        let nextPlayer =
            miningPlayers[nextIndex];

        document.getElementById("result").innerHTML =

            "<h2>スマホを渡してください</h2>" +

            "<h3>" +
            nextPlayer.name +
            "の番です</h3>" +

            "<button onclick='nextMiningPlayer()'>" +
            "次へ" +
            "</button>";

    }
    else {

    let leaderName = "";

    for(let i = 0; i < players.length; i++) {

        if(players[i].role === "リーダー") {

            leaderName = players[i].name;

        }

    }

    document.getElementById("result").innerHTML =

        "<h2>スマホをリーダー（" +
        leaderName +
        "）に渡してください</h2>" +

        "<button onclick='showMiningResult()'>" +
        "結果発表へ" +
        "</button>";

}

}
function nextMiningPlayer() {

    miningIndex++;

    showMiningPlayer();

}
function showMiningResult() {

    let sum = 0;

    for(let i = 0; i < deliveryAmounts.length; i++) {

    sum += deliveryAmounts[i];

}
let memberNames = [];

for(let i = 0; i < miningPlayers.length; i++) {

    memberNames.push(
        miningPlayers[i].name
    );

}

miningHistory.push({

    round: round,

    members: memberNames,

    total: sum

});
showHistory();


    let result;

    if(sum >= 300) {

        result = "成功！";
        citizenWins++;

    }
    else {

        result = "失敗...";
        thiefWins++;

    }

    if(citizenWins >= 5) {

        let everyoneMined = true;

        let missingPlayers = "";

        for(let i = 0; i < players.length; i++) {

            if(players[i].mineCount === 0) {

                everyoneMined = false;

                missingPlayers +=
                    players[i].name +
                    "<br>";

            }

        }

        gameOver = true;

        if(everyoneMined) {

    showEnding(
        "市民陣営の勝利！",
        "市民 5勝　盗賊 " +
        thiefWins +
        "勝"
    );

}
        else {

            showEnding(
    "盗賊陣営の勝利！",
    "未採掘プレイヤーあり"
);

        }
        

        return;

    }

    if(thiefWins >= 5) {

        gameOver = true;

        showEnding(
    "盗賊陣営の勝利！",
    "市民 " +
    citizenWins +
    "勝　盗賊 5勝"
);

        return;

    }


    document.getElementById("scoreDisplay").innerHTML =

        "市民 " +
        citizenWins +
        "勝　盗賊 " +
        thiefWins +
        "勝";

    document.getElementById("result").innerHTML =

        "<h2>結果発表</h2>" +

        "<p>合計 " +
        sum +
        " 個</p>" +

        "<h3>" +
        result +
        "</h3>";

    document.getElementById("nextRoundButton").style.display =
        "inline-block";

}
function showEnding(title, scoreText) {

    document.getElementById("result").innerHTML =

        "<h1>" +
        title +
        "</h1><br>" +

        "<h2>ゲーム終了</h2><br>" +

        "<p>" +
        scoreText +
        "</p><br>" +

        "<button onclick='resetGame()'>" +
        "リセットする" +
        "</button>";

}

function showRuleBook() {

    alert("Coming soon...");

}
function showHistory() {

    let html =

        "<h3>採掘履歴</h3>" +

        "<table border='1' style='margin:auto; min-width:900px;'>";

    html += "<tr>";

for(let i = 1; i <= 9; i++) {

    html +=

        "<th>Round " +

        i +

        "</th>";

}

html += "</tr>";

    html += "<tr>";

for(let i = 0; i < 9; i++) {

    if(i < miningHistory.length) {

        html +=

            "<td>" +

            miningHistory[i].members[0] +
            "<br>" +

            miningHistory[i].members[1] +
            "<br>" +

            miningHistory[i].members[2] +

            "</td>";

    }
    else {

        html +=

            "<td>" +

            "－<br>" +

            "－<br>" +

            "－" +

            "</td>";

    }

}

html += "</tr>";
html += "<tr>";

for(let i = 0; i < 9; i++) {

    if(i < miningHistory.length) {

        html +=

            "<td>" +

            miningHistory[i].total +

            "個" +

            "</td>";

    }
    else {

        html += "<td>－</td>";

    }

}

html += "</tr>";

    html += "</table>";

    document.getElementById("historyDisplay").innerHTML =
        html;

}