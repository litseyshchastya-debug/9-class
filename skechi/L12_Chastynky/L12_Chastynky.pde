// Урок 12. Система частинок з ArrayList: фонтан за курсором
// Клацання — «вибух» із 100 частинок.

ArrayList<Particle> particles = new ArrayList<Particle>();

void setup() {
  size(600, 400);
}

void draw() {
  background(20);
  // Щокадру додаємо дві нові частинки
  particles.add(new Particle(mouseX, mouseY));
  particles.add(new Particle(mouseX, mouseY));

  // Перебираємо з кінця, щоб безпечно видаляти
  for (int i = particles.size() - 1; i >= 0; i--) {
    Particle p = particles.get(i);
    p.update();
    p.display();
    if (p.isDead()) {
      particles.remove(i);
    }
  }

  fill(255);
  text("Частинок: " + particles.size(), 10, 20);
}

void mousePressed() {
  for (int i = 0; i < 100; i++) {
    particles.add(new Particle(mouseX, mouseY));
  }
}

class Particle {
  float x, y;
  float vx, vy;
  float life = 255;     // «тривалість життя» = прозорість
  color c;

  Particle(float startX, float startY) {
    x = startX;
    y = startY;
    float angle = random(TWO_PI);
    float speed = random(1, 4);
    vx = cos(angle) * speed;
    vy = sin(angle) * speed - 2;
    c = color(random(200, 255), random(80, 200), random(50));
  }

  void update() {
    vy += 0.1;          // гравітація
    x += vx;
    y += vy;
    life -= 3;
  }

  void display() {
    noStroke();
    fill(c, life);
    ellipse(x, y, 8, 8);
  }

  boolean isDead() {
    return life <= 0;
  }
}
