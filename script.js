// 盗賊陣営や第三陣営を追加したら、getFunction()を修正。市民陣営=0,盗賊陣営=2,第三陣営=1

const MIN_MINING = 50; // 採掘量の下限
const MAX_MINING = 130; // 採掘量の上限
const MAX_STOCK = 10;  // 備蓄の上限
const LEADER_MAX_MINE = 1; // リーダーの採掘可能回数
const MAX_NAME_LENGTH = 4; // 名前の長さ
const CITIZEN_WIN_COUNT = 5;// 市民勝利条件数
const THIEF_WIN_COUNT = 5;//盗賊勝利条件数
const MAX_ROUND = CITIZEN_WIN_COUNT + THIEF_WIN_COUNT - 1;

// 以下、採掘確率
const MINING_ROLLS = 40; // 試行回数
const LOW_RATE = 0.59; // LOW_REWARDの確率
const MID_RATE = 0.02; // MID_REWARDの確率

const LOW_REWARD = 1;
const MID_REWARD = 4;
const HIGH_REWARD = 5;
// 以上、採掘確率

// 以下、詳細設定用
let PLAYER_COUNT = 6;//参加人数
let useRookie = false;//「新人」
let useRumorLover = false;//「噂好き」
let accidentEnabled = false;// 落盤事故
// 以上、詳細設定用

// 以下、採掘事故用
const ACCIDENT_RATE = 0.04;// 事故発生確率
const ACCIDENT_A_RATE = 0.20;// 事故A発生
const ACCIDENT_A_PENALTY = 10;// 事故Aの個人採掘量のマイナス量
const ACCIDENT_B_PENALTY = 2;// 事故Bの個人採掘量のマイナス量

let accidentType = "";

// 以上、採掘事故用

// 役職のデータ
const ROLE_DATA = {

    "リーダー": {
        faction: 0,
        displayRole: "リーダー",
        revealRole: "リーダー",
        miningBonus: 10,
        isPublic: false
    },

    "採掘者S": {
        faction: 0,
        displayRole: "採掘者",
        revealRole: "採掘者",
        miningBonus: 4,
        isPublic: false
    },

    "採掘者A": {
        faction: 0,
        displayRole: "採掘者",
        revealRole: "採掘者",
        miningBonus: 2,
        isPublic: false
    },

    "採掘者B": {
        faction: 0,
        displayRole: "採掘者",
        revealRole: "採掘者",
        miningBonus: 0,
        isPublic: false
    },

    "採掘者C": {
        faction: 0,
        displayRole: "採掘者",
        revealRole: "採掘者",
        miningBonus: -2,
        isPublic: false
    },

    "新人": {
        faction: 0,
        displayRole: "新人",
        revealRole: "新人",
        miningBonus: -10,
        isPublic: true
    },

    "噂好き": {
        faction: 0,
        displayRole: "採掘者",
        revealRole: "噂好き",
        miningBonus: 0,
        isPublic: false
    },

    "盗賊": {
        faction: 2,
        displayRole: "盗賊",
        revealRole: "盗賊",
        miningBonus: 15,
        isPublic: false
    },

    "共犯者": {
        faction: 2,
        displayRole: "共犯者",
        revealRole: "共犯者",
        miningBonus: 12,
        isPublic: false
    }

};


// プレイヤー一覧
let players = createPlayers();

function createPlayers() {

    let players = [];

    for(
        let i = 1;
        i <= PLAYER_COUNT;
        i++
    ) {

        players.push({

            name:
                "プレイヤー" + i,

            role: "",

            stock: 0,

            mineCount: 0

        });

    }

    return players;

}

const REQUIRED_ROLES = [

    "リーダー",

    "盗賊",

    "共犯者"

];
const OPTIONAL_ROLES = [

    "採掘者C",

    "採掘者B",

    "採掘者A",

    "採掘者S"

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

// 新人、噂好きの有無
let rookieEnabled = false;
let rumorEnabled = false;

let revealPlayerIndex = 0;

function showPlayerNameInputs() {

    let html =
        "<h3>プレイヤー名設定</h3>";

    for(let i = 0; i < PLAYER_COUNT; i++) {

        html +=

            "プレイヤー" +

            (i + 1) +

            "<input type='text' id='name" +

            i +

            "'>" +

            "<br><br>";

    }

    document.getElementById(
        "playerNameArea"
    ).innerHTML = html;

}

// 使用役職の確認
function getRoles() {

    let roles = [];

    for(
        let i = 0;
        i < REQUIRED_ROLES.length;
        i++
    ) {

        roles.push(
            REQUIRED_ROLES[i]
        );

    }

    if(rookieEnabled) {

        roles.push(
            "新人"
        );

    }

    if(rumorEnabled) {

        roles.push(
            "噂好き"
    );
    }

    let minerCount =
        PLAYER_COUNT -
        roles.length;

    for(
        let i = 0;
        i < minerCount;
        i++
    ) {

        roles.push(
            OPTIONAL_ROLES[i]
        );

    }

    return roles;

}

// 市民陣営なら0、盗賊陣営なら2、第三陣営なら1を返す
function getFaction(role) {

    return ROLE_DATA[role].faction;

}

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
// 採掘量の調整
function getMiningAmount(role) {

    let amount = rollBase();

    amount +=
        ROLE_DATA[role]
        .miningBonus;
    if(
    accidentType === "A"
    ) {

    amount -=
        ACCIDENT_A_PENALTY;

    }
    if(
    accidentType === "B"
    ) {

    amount -=
        ACCIDENT_B_PENALTY;

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

    return ROLE_DATA[role].displayRole;

}
// 事故について
function determineAccident() {

    if(!accidentEnabled) {

    accidentType = "";

    return;

}

    accidentType = "";

    if(
        Math.random() <
        ACCIDENT_RATE
    ) {

        if(
            Math.random() <
            ACCIDENT_A_RATE
        ) {

            accidentType = "A";

        }
        else {

            accidentType = "B";

        }

    }

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

determineAccident();
console.log(accidentType);
miningIndex = 0;

miningAmounts = [];

showMiningPlayer();

return;
   
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

    document.getElementById(
    "homeArea"
    ).style.display = "none";
    
    document.getElementById("roundDisplay").style.display =
    "block";
    document.getElementById("scoreDisplay").style.display =
    "block";

    
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

// 役職をそれぞれに割り振っている
function setupGame() {

    let roles = getRoles();

    shuffle(roles);

    for(let i = 0; i < players.length; i++) {

        players[i].role = roles[i];

        players[i].faction =
            getFaction(
                players[i].role
            );

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

    document.getElementById(
    "homeArea"
    ).style.display = "block";

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

    document.getElementById(
        "roleButton"
    ).style.display = "none";

    if(rookieEnabled) {

        document.getElementById(
            "roleDisplay"
        ).innerHTML =

            "全員確認済みです<br><br>" +

            "端末をリーダーに渡してください<br><br>" +

            "<button onclick='showRookieReveal()'>" +

            "次へ" +

            "</button>";

        return;

    }

    document.getElementById(
        "meetingButton"
    ).style.display =
        "inline-block";

    document.getElementById(
        "roleDisplay"
    ).innerHTML =

        "全員確認済みです<br><br>" +

        "会議を開始してください";

    return;
    }


    document.getElementById("roleDisplay").innerHTML =
        players[revealPlayerIndex].name +
        "<br><br>" +
        "端末を受け取ってください<br><br>" +
        "<button onclick='revealRole()'>役職を見る</button>";

}
function showRookieReveal() {

    let rookieName = "";

    for(
        let i = 0;
        i < players.length;
        i++
    ) {

        if(
            players[i].role ===
            "新人"
        ) {

            rookieName =
                players[i].name;

        }

    }

    document.getElementById(
        "meetingButton"
    ).style.display =
        "inline-block";

    document.getElementById(
        "roleDisplay"
    ).innerHTML =

        "新人は" +
        rookieName +
        "です<br><br>" +

        "皆さんに紹介してから<br><br>" +

        "会議を開始してください";

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
    let accidentMessage = "";
    if(accidentType === "B") {

    let factionSum = 0;

    for(
        let i = 0;
        i < miningPlayers.length;
        i++
    ) {

        factionSum +=
            miningPlayers[i].faction;

    }

    if(factionSum > 0) {

        accidentMessage =

            "<br><br>" +

            "不穏な噂が流れている…";

    }

}

    document.getElementById("result").innerHTML =

    "<h2>" +
    player.name +
    "の採掘</h2>" +

    accidentMessage +

    "<br><br>" +

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

            "<h2>端末を渡してください</h2>" +

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

        "<h2>端末をリーダー（" +
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
function getRevealRole(role) {

    return ROLE_DATA[role].revealRole;

}
function getRoleList() {

    let html = "";

    for(let i = 0; i < players.length; i++) {

        html +=

            players[i].name +

            " ： " +

            getRevealRole(
                players[i].role
            ) +

            "<br>";

    }

    return html;

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
    let rumorText = "";
    let accidentText = "";

    let rumorLoverExists = false;
    for(
    let i = 0;
    i < miningPlayers.length;
    i++
) {

    if(
        miningPlayers[i].role ===
        "噂好き"
    ) {

        rumorLoverExists = true;

    }

}
if(
    accidentType === "A" ||
    accidentType === "B"
) {

    accidentText =

        "<br><br>" +

        "<h3>落盤事故が発生した！</h3>";

}
let factionSum = 0;
for(
    let i = 0;
    i < miningPlayers.length;
    i++
) {

    factionSum +=
        miningPlayers[i].faction;

}
if(
    rumorLoverExists &&
    factionSum > 0 &&
    sum < 300
) {

    rumorText =

        "<br><br>" +

        "不穏な噂が流れている…";

}


    if(citizenWins >= CITIZEN_WIN_COUNT) {

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

    if(thiefWins >= THIEF_WIN_COUNT) {

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
        "</h3>"+

        accidentText +

        rumorText;

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

        "<h2>役職一覧</h2>" +

        getRoleList() +

        "<br>" +

        "<button onclick='resetGame()'>" +
        "リセットする" +
        "</button>";

}
function showHistory() {

    let html =

        "<h3>採掘履歴</h3>" +

        "<table border='1' style='margin:auto; min-width:900px;'>";

    html += "<tr>";

for(let i = 1; i <= MAX_ROUND; i++) {

    html +=

        "<th>Round " +

        i +

        "</th>";

}

html += "</tr>";

    html += "<tr>";

for(let i = 0; i < MAX_ROUND; i++) {

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

for(let i = 0; i < MAX_ROUND; i++) {

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

// ルールブック
function showRuleBook() {

    document.getElementById(
        "homeArea"
    ).style.display = "none";

    document.getElementById(
        "ruleBookDisplay"
    ).innerHTML =

        "<h2>ルールブック</h2>" +

        "<button onclick='showGameOverview()'>" +
        "ゲーム概要" +
        "</button><br>" +

        "<button onclick='showRoles()'>" +
        "役職説明" +
        "</button><br>" +

        "<button onclick='showFlow()'>" +
        "ゲームの流れ" +
        "</button><br>" +

        "<button onclick='showRules()'>" +
        "禁止事項" +
        "</button><br>" +

        "<button onclick='showVictory()'>" +
        "勝利条件" +
        "</button><br>" +

        "<button onclick='showTips()'>" +
        "Tips" +
        "</button><br>" +

        "<button onclick='closeRuleBook()'>" +
        "閉じる" +
        "</button";

}
function showGameOverview() {

    document.getElementById(
        "ruleBookDisplay"
    ).innerHTML =

        "<h2>ゲーム概要</h2>" +

        "<div class='ruleCard'>" +

        "<p>" +
        "あなたたちは採掘会社の社員です。" +
        "</p>" +

        "<p>" +
        "会社は一大プロジェクトを立ち上げ、多くの宝石を採掘することを目標としています。" +
        "</p>" +

        "<p>" +
        "しかし、そのメンバーの中には会社への不満からプロジェクトの失敗を目論む者が紛れ込んでいます。" +
        "</p>" +

        "<p>" +
        "リーダーはプロジェクトを成功させることができるでしょうか。" +
        "</p>" +

        "</div>" +

        "<button onclick='showRuleBook()'>" +
        "戻る" +
        "</button>";

}
function showRoles() {

    document.getElementById(
        "ruleBookDisplay"
    ).innerHTML =

        "<h2>役職説明</h2>" +

        "<div class='ruleCard'>" +

        "<h3>リーダー</h3>" +

        "<p>" +
        "採掘メンバーを選出します。リーダーは採掘に参加できる回数が制限されています。" +
        "</p>" +

        "<p>" +
        "若手ながら幸運にも一大プロジェクトを任された管理者です。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>採掘者</h3>" +

        "<p>" +
        "市民陣営です。採掘と納品を行い、プロジェクトの成功を目指します。" +
        "</p>" +

        "<p>" +
        "リーダーの部下として、一大プロジェクトに参加し、結果を出して出世コースに乗りたいと考えています。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>新人</h3>" +

        "<p>" +

        "市民陣営です。役職確認終了後、新人であることが全員に公開されます。" +

        "</p>" +

        "<p>" +

        "リーダーが連れてきた新人採掘者です。採掘にはまだ不慣れです。" +

        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>噂好き</h3>" +

        "<p>" +

        "市民陣営です。噂好きが採掘メンバーに選ばれた際、納品に失敗した場合、不穏な噂が流れることがあります。" +

        "</p>" +

        "<p>" +

        "坑道内の出来事に詳しく、どこからともなく集まる噂話を好んでいます。しかし、自分が噂好きであることは周囲に知られたくないようです。" +

        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>盗賊</h3>" +

        "<p>" +
        "盗賊陣営です。採掘した宝石の一部を納品せず、自分のものにすることができます。" +
        "</p>" +

        "<p>" +
        "頭の切れる優秀な採掘者ですが、才能に見合った報酬を受けられず、プロジェクトの失敗を企てています。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>共犯者</h3>" +

        "<p>" +
        "盗賊陣営です。会議後に採掘メンバーを1人変更できます。" +
        "</p>" +

        "<p>" +
        "盗賊に心酔し、自ら犠牲になってでもプロジェクトを破壊しようと考えています。" +
        "</p>" +

        "</div>" +

        "<button onclick='showRuleBook()'>" +
        "戻る" +
        "</button>";

}

function showFlow() {

    document.getElementById(
        "ruleBookDisplay"
    ).innerHTML =

        "<h2>ゲームの流れ</h2>" +

        "<div class='ruleCard'>" +

        "<h3>① 役職確認</h3>" +

        "<p>" +
        "順番に端末を回し、自分の役職を確認します。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>② 会議</h3>" +

        "<p>" +
        "全員で話し合い、誰を採掘メンバーに選出するか相談します。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>③ 採掘メンバー選出</h3>" +

        "<p>" +
        "リーダーは採掘メンバーを3人選出します。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>④ 共犯者能力</h3>" +

        "<p>" +
        "共犯者は必要であれば能力を使用し、採掘メンバーを変更します。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>⑤ 採掘</h3>" +

        "<p>" +
        "選出されたメンバーは採掘を行います。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>⑥ 納品</h3>" +

        "<p>" +
        "採掘した宝石のうち、何個を納品するか決定します。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>⑦ 結果発表</h3>" +

        "<p>" +
        "納品個数の合計を発表します。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>⑧ 次ラウンド</h3>" +

        "<p>" +
        "勝敗が決まっていなければ次のラウンドへ進みます。" +
        "</p>" +

        "</div>" +
        "<div class='ruleCard'>" +

        "<h3>補足：採掘事故</h3>" +

        "<p>" +

        "採掘事故設定がONの場合、低確率で落盤事故が発生します。" +

        "</p>" +

        "<p>" +

        "落盤事故は採掘結果や、その後の議論に影響を与えることがあります。" +

        "</p>" +

        "</div>" +

        "<button onclick='showRuleBook()'>" +

        "戻る" +

        "</button>";

}
function showRules() {

    document.getElementById(
        "ruleBookDisplay"
    ).innerHTML =

        "<h2>禁止事項</h2>" +

        "<div class='ruleCard'>" +

        "<h3>① 採掘参加者による採掘フェーズ中の発言</h3>" +

        "採掘フェーズ中、採掘に参加しているプレイヤーは発言できません。<br>" +

        "採掘に参加していないプレイヤーは自由に発言できます。" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>② 宝石数の公開</h3>" +

        "ゲーム中、自分が獲得した宝石の具体的な個数を公開してはいけません。<br>" +

        "また、端末の画面を見せるなどして、獲得した宝石数を証明する行為も禁止します。<br><br>" +

        "ただし、「多めに採れた」「少なめだった」など、具体的な個数を含まない曖昧な表現による発言は可能です。" +

        "</div>" +

        "<button onclick='showRuleBook()'>" +

        "戻る" +

        "</button>";

}
function showVictory() {

    document.getElementById(
        "ruleBookDisplay"
    ).innerHTML =

        "<h2>勝利条件</h2>" +

        "<div class='ruleCard'>" +

        "<h3>市民陣営</h3>" +

        "<p>" +
        "300個以上の納品を達成することでプロジェクトは成功となります。" +
        "</p>" +

        "<p>" +
        "プロジェクトを5回成功させることができれば、市民陣営の勝利です。" +
        "</p>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>盗賊陣営</h3>" +

        "<p>" +
        "市民陣営のプロジェクト成功を阻止することが目的です。" +
        "</p>" +

        "<p>" +
        "また、市民陣営が5回プロジェクトを成功させた場合でも、一度も採掘に参加していないプレイヤーがいる場合は盗賊陣営の勝利となります。" +
        "</p>" +

        "</div>" +

        "<button onclick='showRuleBook()'>" +

        "戻る" +

        "</button>";

}
function showTips() {

    document.getElementById(
        "ruleBookDisplay"
    ).innerHTML =

        "<h2>Miner Tips</h2>" +

        "<div class='ruleCard'>" +

        "<h3>採掘量について</h3>" +

        "<ul>" +

        "<li>採掘者の採掘量の期待値は約104.7個です。</li>" +

        "<li>リーダー、盗賊、共犯者の期待値は採掘者より高くなっています。</li>" +

        "<li>採掘者ごとに採掘量の期待値は異なりますが、期待値が100個を下回ることはありません。</li>" +

        "</ul>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>納品成功率について</h3>" +

        "<ul>" +

        "<li>採掘メンバー3人がすべて市民陣営の場合、300個以上納品できる確率は約75.4％～89.5％です。</li>" +

        "<li>採掘メンバーのうち2人が市民陣営で、盗賊陣営のプレイヤーが50個のみ納品した場合、300個以上納品できる確率は約0.8％～12.5％になります。</li>" +

        "</ul>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>ワンポイント</h3>" +

        "<ul>" +

        "<li>盗賊陣営が採掘メンバーに含まれている場合、納品量は大きく低下する可能性があります。</li>" +

        "<li>市民陣営は採掘メンバーの選出や備蓄の管理が重要になります。</li>" +

        "</ul>" +

        "</div>" +

        "<div class='ruleCard'>" +

        "<h3>不穏な噂について</h3>" +

        "<p>" +

        "「不穏な噂が流れている…」というメッセージは、何らかの重要な情報を示している可能性があります。" +

        "</p>" +

        "<p>" +

        "メッセージが表示された状況や採掘メンバーに注目してみましょう。" +

        "</p>" +

        "</div>" +

        "<button onclick='showRuleBook()'>" +
        "戻る" +
        "</button>";

}
function closeRuleBook() {

    document.getElementById(
    "homeArea"
    ).style.display = "block";

    document.getElementById(
        "ruleBookDisplay"
    ).innerHTML = "";

}
 

// 以下、設定画面
function showSettings() {

    document.getElementById(
    "homeArea"
    ).style.display = "none";

    document.getElementById(
        "settingsDisplay"
    ).innerHTML =

        "<h2>設定</h2>" +

        "<h3>プレイ人数</h3>" +

        "<input type='radio' " +
        "name='playerCount' " +
        "value='6' checked>" +
        "6人<br>" +

        "<input type='radio' " +
        "name='playerCount' " +
        "value='7'>" +
        "7人<br><br>" +

        "<h3>追加役職</h3>" +

        "<input type='checkbox' " +
        "id='rookieOption'>" +
        "新人<br>" +

        "<input type='checkbox' " +
        "id='rumorOption'>" +"噂好き<br>" +

        "<h3>採掘事故の追加</h3>" +

        "<input type='checkbox' " +
        "id='accidentOption'>" +
        "採掘事故<br><br>" +

        "<button onclick='saveSettings()'>" +
        "保存" +
        "</button>" +
        "<button onclick='closeSettings()'>" +
        "閉じる" +
        "</button>";

}
function saveSettings() {

    let selectedPlayerCount =

        document.querySelector(
            'input[name="playerCount"]:checked'
        ).value;

    PLAYER_COUNT =
        Number(selectedPlayerCount);

    rookieEnabled =
        document.getElementById(
            "rookieOption"
        ).checked;
    rumorEnabled =
        document.getElementById(
            "rumorOption"
        ).checked;
    accidentEnabled =
    document.getElementById(
        "accidentOption"
    ).checked;

    players = createPlayers();

    showPlayerNameInputs();

    closeSettings();

}
function closeSettings() {

    document.getElementById(
        "settingsDisplay"
    ).innerHTML = "";

    document.getElementById(
    "homeArea"
).style.display = "block";
}
showPlayerNameInputs();