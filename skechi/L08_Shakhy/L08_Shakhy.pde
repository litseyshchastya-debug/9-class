// Урок 8. Шахова дошка 8×8 — вкладені цикли та остача від ділення

int n = 8;

void setup() {
  size(400, 400);
  noStroke();
}

void draw() {
  float cell = width / (float) n;
  for (int i = 0; i < n; i++) {        // рядки
    for (int j = 0; j < n; j++) {      // стовпці
      if ((i + j) % 2 == 0) fill(240, 217, 181);
      else                  fill(181, 136, 99);
      rect(j * cell, i * cell, cell, cell);
    }
  }
}
