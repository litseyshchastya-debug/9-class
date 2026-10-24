"""Початковий код онлайн-практикуму для кожного уроку.
Кожен запис — список вкладок (назва, код). Завдання записано в коментарях."""

STARTERY = {
    1: [("Urok01", """// Практикум до уроку 1
// Рівень 1: вікно 500×500 і «хрест» двома лініями з кута в кут.
// Рівень 2: будиночок (rect — стіна, дві лінії — дах, квадрат — вікно, ellipse — сонце).
// Рівень 3: ваш ініціал лише з line() і rect().

size(500, 500);
background(255);

line(0, 0, 500, 500);   // перша діагональ
// допишіть другу діагональ:

println("Привіт, Processing!");
""")],
    2: [("Urok02", """// Практикум до уроку 2
// Рівень 1: світлофор — прямокутник і три кола.
// Рівень 2: перенесіть на екран свого робота; використайте rectMode(CENTER).
// Рівень 3: п'ятикутна зірка через beginShape()/vertex() і «Пакмен» через arc().

size(200, 400);
background(255);
rectMode(CENTER);

fill(60);
rect(100, 200, 120, 340);    // корпус світлофора

fill(255, 0, 0);
ellipse(100, 90, 80, 80);    // червоне світло
// додайте жовте та зелене світло:
""")],
    3: [("Urok03", """// Практикум до уроку 3
// Рівень 1: розфарбуйте робота в кольори RGB.
// Рівень 2: три прозорі кола (червоне, зелене, синє) — поясніть кольори перетинів.
// Рівень 3: композиція в стилі Мондріана. Підбирайте кольори: Інструменти → Вибір кольору.

size(400, 400);
background(255);
noStroke();

fill(255, 0, 0, 130);
ellipse(160, 160, 180, 180);
// додайте зелене й синє кола з прозорістю 130:
""")],
    4: [("Urok04", """// Практикум до уроку 4
// Рівень 1: змінюючи лише x, y, d, перемістіть коло в три різні місця.
// Рівень 2: усі координати персонажа залежать від charX і charY.
// Рівень 3: додайте змінну scale (float) і множте на неї всі розміри.

int x = 200;
int y = 200;
int d = 80;

size(400, 400);
background(255);
ellipse(x, y, d, d);

println("7 / 2 = " + (7 / 2));
println("7.0 / 2 = " + (7.0 / 2));
""")],
    5: [("Urok05", """// Практикум до уроку 5
// Рівень 1: коло рухається по діагоналі.
// Рівень 2: коло рухається, збільшується і змінює колір від чорного до білого.
// Рівень 3: «Захід сонця» — сонце опускається, небо темнішає.

float x = 0;
float y = 0;

void setup() {
  size(400, 400);
}

void draw() {
  background(255);
  fill(0);
  ellipse(x, y, 40, 40);
  x = x + 2;
  // змініть і y, щоб коло рухалося по діагоналі
}
""")],
    6: [("Urok06", """// Практикум до уроку 6
// Рівень 1: персонаж слідує за мишею.
// Рівень 2: колір очей залежить від mouseX, клацання — випадковий колір фону.
// Рівень 3: «симетрична малювалка» — дзеркальна лінія (width - mouseX).

color bg = color(255);

void setup() {
  size(400, 400);
}

void draw() {
  background(bg);
  rectMode(CENTER);
  fill(150);
  rect(mouseX, mouseY + 20, 20, 60);   // тіло
  fill(255);
  ellipse(mouseX, mouseY - 20, 50, 50); // голова
}

void mousePressed() {
  // змініть bg на випадковий колір: color(random(255), random(255), random(255))
}
""")],
    7: [("Urok07", """// Практикум до уроку 7
// Рівень 1: екран поділено на 4 квадрати; квадрат під курсором стає чорним.
// Рівень 2: м'яч відскакує від стінок і змінює колір при кожному відскоку.
// Рівень 3: ракетка внизу керується мишею; якщо м'яч упав — «Гру закінчено».

void setup() {
  size(400, 400);
}

void draw() {
  background(255);
  stroke(0);
  // лівий верхній квадрат
  if (mouseX < width/2 && mouseY < height/2) {
    fill(0);
  } else {
    fill(255);
  }
  rect(0, 0, width/2, height/2);
  // допишіть умови для інших трьох квадратів
}
""")],
    8: [("Urok08", """// Практикум до уроку 8
// Рівень 1: 10 кіл в один рядок за допомогою for.
// Рівень 2: шахова дошка 8×8 (вкладені цикли та %).
// Рівень 3: сітка кіл, діаметр яких залежить від відстані до курсора — dist().

void setup() {
  size(500, 200);
}

void draw() {
  background(255);
  for (int i = 0; i < 10; i++) {
    ellipse(25 + i * 50, height/2, 40, 40);
  }
}
""")],
    9: [("Urok09", """// Практикум до уроку 9
// Рівень 1: кубик — клацання показує випадкове число від 1 до 6.
// Рівень 2: зоряне небо з 200 мерехтливих зірок.
// Рівень 3: генеративний постер (noise, random, randomSeed); клавіша s — saveFrame().

int dice = 1;

void setup() {
  size(300, 300);
  textAlign(CENTER, CENTER);
  textSize(120);
}

void draw() {
  background(240);
  fill(0);
  text(dice, width/2, height/2);
}

void mousePressed() {
  dice = int(random(6)) + 1;
}
""")],
    10: [("Urok10", """// Практикум до уроку 10
// Рівень 1: функція drawFlower(x, y, size) і клумба з 5 квітів.
// Рівень 2: перепишіть м'яч з уроку 7 на функції move(), bounce(), display().
// Рівень 3: drawCharacter(x, y, scale, mood) і натовп із 20 персонажів у циклі.

void setup() {
  size(500, 300);
}

void draw() {
  background(120, 190, 90);
  drawFlower(100, 150, 60);
  // намалюйте ще чотири квітки
}

void drawFlower(float x, float y, float s) {
  noStroke();
  fill(255, 90, 120);
  for (int i = 0; i < 6; i++) {
    float a = TWO_PI / 6 * i;
    ellipse(x + cos(a) * s / 3, y + sin(a) * s / 3, s / 2, s / 2);
  }
  fill(255, 210, 0);
  ellipse(x, y, s / 3, s / 3);
}
""")],
    11: [("Urok11", """// Практикум до уроку 11
// Рівень 1: створіть третю машину іншого кольору та швидкості.
// Рівень 2: клас Ball (move, bounce, display) — три м'ячі. Додайте вкладку «+».
// Рівень 3: клас Character з методами display(), move(), jiggle(), isUnderMouse().

Car redCar;
Car blueCar;

void setup() {
  size(400, 200);
  redCar  = new Car(color(255, 0, 0), 0, 60, 2);
  blueCar = new Car(color(0, 0, 255), 0, 140, 1);
}

void draw() {
  background(255);
  redCar.move();
  redCar.display();
  blueCar.move();
  blueCar.display();
}
"""), ("Car", """// Клас Car — «формочка» для машин

class Car {
  color c;
  float x, y;
  float speed;

  Car(color tempC, float tempX, float tempY, float tempSpeed) {
    c = tempC;
    x = tempX;
    y = tempY;
    speed = tempSpeed;
  }

  void move() {
    x += speed;
    if (x > width + 20) {
      x = -20;
    }
  }

  void display() {
    rectMode(CENTER);
    stroke(0);
    fill(c);
    rect(x, y, 40, 20);
  }
}
""")],
    12: [("Urok12", """// Практикум до уроку 12
// Рівень 1: стовпчикова діаграма з масиву з 10 чисел.
// Рівень 2: снігопад — масив зі 100 сніжинок (клас Snowflake).
// Рівень 3: феєрверк з ArrayList — частинки розлітаються при клацанні.

int[] values = {40, 90, 150, 70, 200, 120, 60, 180, 100, 30};

void setup() {
  size(500, 300);
}

void draw() {
  background(255);
  float w = width / values.length;
  for (int i = 0; i < values.length; i++) {
    fill(80, 120, 220);
    rect(i * w, height - values[i], w - 4, values[i]);
  }
}
""")],
    13: [("Urok13", """// Практикум до уроку 13
// Рівень 1: швидкість обертання квадрата залежить від mouseX.
// Рівень 2: годинник зі стрілками (hour(), minute(), second()).
// Рівень 3: квітка-мандала — 12 пелюсток через rotate(TWO_PI/12) і пульсація sin().

float angle = 0;

void setup() {
  size(400, 400);
}

void draw() {
  background(255);
  pushMatrix();
  translate(width/2, height/2);
  rotate(angle);
  rectMode(CENTER);
  fill(255, 150, 0);
  rect(0, 0, 120, 120);
  popMatrix();
  angle += 0.02;   // зробіть швидкість залежною від mouseX: map(mouseX, 0, width, 0, 0.2)
}
""")],
    14: [("Urok14", """// Практикум до уроку 14
// Рівень 1: своє ім'я по центру; колір тексту залежить від положення миші.
// Рівень 2: власне фото (Скетч → Додати файл) і фільтри на клавіші 1–4.
// Рівень 3: «ліхтарик» — яскравість пікселів залежить від dist() до миші.

void setup() {
  size(500, 250);
  textFont(createFont("Arial", 48));
  textAlign(CENTER, CENTER);
}

void draw() {
  background(30);
  fill(mouseX * 255 / width, 150, 255);
  text("Моє ім'я", width/2, height/2);
}

// Рівень 2 (зразок):
// PImage img;            — у setup(): img = loadImage("photo.jpg");
// image(img, 0, 0);      — у draw();  filter(GRAY);  filter(INVERT);
""")],
    16: [("Proyekt", """// Підсумковий проєкт
// 1. Опишіть задум у коментарі.
// 2. Розбийте його на частини: які класи, функції, змінні?
// 3. Пишіть по кілька рядків і часто запускайте ▶.
// Перевірене рішення: Файл → Завантажити як .pde → відкрийте в Processing.

// Задум:

ArrayList<Thing> things = new ArrayList<Thing>();

void setup() {
  size(600, 400);
}

void draw() {
  background(255);
  for (Thing t : things) {
    t.update();
    t.display();
  }
}

void mousePressed() {
  things.add(new Thing(mouseX, mouseY));
}
"""), ("Thing", """// Клас головного об'єкта проєкту — перейменуйте й допишіть

class Thing {
  float x, y;

  Thing(float startX, float startY) {
    x = startX;
    y = startY;
  }

  void update() {
    y += 1;
  }

  void display() {
    fill(0, 120, 255);
    ellipse(x, y, 30, 30);
  }
}
""")],
}

# Урок 15: практикум починається з повної гри «Ловець» (усі вкладки скетчу L15_Lovets)
STARTER_FROM_SKETCH = {15: "L15_Lovets"}

PISOCHNYTSIA = [("sketch", """// Пісочниця: пишіть будь-який скетч Processing.
// ▶ або Ctrl+R — запуск; приклади з усіх уроків — у меню «Приклади».

void setup() {
  size(400, 400);
}

void draw() {
  background(255);
  ellipse(mouseX, mouseY, 40, 40);
}
""")]
