let gameHasStarted = false;
var board = null;
var game = new Chess();
var $status = $("#status");
var $pgn = $("#pgn");
let gameOver = false;

function onDragStart(source, piece, position, orientation) {
  if (game.game_over()) return false;
  if (!gameHasStarted) return false;
  if (gameOver) return false;

  if (
    (playerColor === "Хар" && piece.search(/^w/) !== -1) ||
    (playerColor === "Цагаан" && piece.search(/^b/) !== -1)
  ) {
    return false;
  }

  if (
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  let theMove = {
    from: source,
    to: target,
    promotion: "q",
  };

  var move = game.move(theMove);

  if (move === null) return "snapback";

  socket.emit("move", theMove);

  updateStatus();
}

socket.on("newMove", function (move) {
  game.move(move);
  board.position(game.fen());
  updateStatus();
});

function onSnapEnd() {
  board.position(game.fen());
}

function updateStatus() {
  var status = "";

  var moveColor = "Цагаан";
  if (game.turn() === "b") {
    moveColor = "Хар";
  }

  if (game.in_checkmate()) {
    status = "Тоглоом дууслаа, " + moveColor + " хожигдолоо.";
  } else if (game.in_draw()) {
    status = "Тоглоом дууслаа, тэнцлээ";
  } else if (gameOver) {
    status = "Өрсөлдөгч гарлаа, та яллаа!";
  } else if (!gameHasStarted) {
    status = "Харыг хүлээж байна";
  } else {
    status = moveColor + " нүүнэ";

    if (game.in_check()) {
      status += ", " + moveColor + " шаг";
    }
  }

  $status.html(status);
  $pgn.html(game.pgn());
}

var config = {
  draggable: true,
  position: "start",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: "/public/img/chesspieces/wikipedia/{piece}.png",
};
board = Chessboard("myBoard", config);
if (playerColor == "black") {
  board.flip();
}

updateStatus();

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("code")) {
  socket.emit("joinGame", {
    code: urlParams.get("code"),
  });
}

socket.on("startGame", function () {
  gameHasStarted = true;
  updateStatus();
});

socket.on("gameOverDisconnect", function () {
  gameOver = true;
  updateStatus();
});
