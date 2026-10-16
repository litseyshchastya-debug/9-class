// Урок 13. Рекурсія + трансформації: фрактальне дерево
// Кут розгалуження керується положенням миші по X.

float theta;

void setup() {
  size(600, 450);
}

void draw() {
  background(255);
  stroke(60, 40, 20);
  theta = map(mouseX, 0, width, 0, HALF_PI);
  translate(width/2, height);   // стовбур росте від низу по центру
  branch(120);
}

// Малює гілку довжини len і дві менші гілки на її кінці
void branch(float len) {
  strokeWeight(max(1, len / 12));
  line(0, 0, 0, -len);
  translate(0, -len);
  if (len > 4) {               // умова зупинки рекурсії
    pushMatrix();
    rotate(theta);
    branch(len * 0.67);
    popMatrix();

    pushMatrix();
    rotate(-theta);
    branch(len * 0.67);
    popMatrix();
  }
}
