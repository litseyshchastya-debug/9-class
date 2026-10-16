// Урок 15. Гра «Ловець крапель» (за ідеєю Д. Шиффмана, розд. 10)
// Керування — мишею. Стани: 0 — меню, 1 — гра, 2 — кінець гри.

int state = 0;
Catcher catcher;
ArrayList<Drop> drops;
Timer timer;
int score;
int lives;
int best = 0;

void setup() {
  size(500, 600);
  textAlign(CENTER, CENTER);
  restart();
}

void restart() {
  catcher = new Catcher(32);
  drops = new ArrayList<Drop>();
  timer = new Timer(1000);   // нова крапля щосекунди
  timer.start();
  score = 0;
  lives = 3;
}

void draw() {
  background(235, 245, 255);
  if (state == 0)      drawMenu();
  else if (state == 1) playGame();
  else                 drawGameOver();
}

void drawMenu() {
  fill(30, 60, 120);
  textSize(40);
  text("Ловець крапель", width/2, height/2 - 40);
  textSize(18);
  text("Клацніть, щоб почати", width/2, height/2 + 20);
}

void playGame() {
  catcher.setLocation(mouseX, height - 60);
  catcher.display();

  if (timer.isFinished()) {
    drops.add(new Drop(1 + score * 0.1));   // що більший рахунок, то швидше
    timer.start();
  }

  for (int i = drops.size() - 1; i >= 0; i--) {
    Drop d = drops.get(i);
    d.move();
    d.display();
    if (catcher.intersect(d)) {
      score++;
      drops.remove(i);
    } else if (d.reachedBottom()) {
      lives--;
      drops.remove(i);
    }
  }

  fill(0);
  textSize(18);
  text("Рахунок: " + score + "    Життя: " + lives, width/2, 20);

  if (lives <= 0) {
    best = max(best, score);
    state = 2;
  }
}

void drawGameOver() {
  fill(180, 30, 30);
  textSize(40);
  text("Гру закінчено", width/2, height/2 - 40);
  fill(0);
  textSize(20);
  text("Рахунок: " + score + "   Рекорд: " + best, width/2, height/2 + 10);
  text("Клацніть, щоб грати ще", width/2, height/2 + 50);
}

void mousePressed() {
  if (state == 0) {
    state = 1;
  } else if (state == 2) {
    restart();
    state = 1;
  }
}
