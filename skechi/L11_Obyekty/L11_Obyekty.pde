// Урок 11. Об'єкти: дві машини одного класу Car (клас — у вкладці Car)

Car redCar;    // 1. Оголошуємо об'єкти
Car blueCar;

void setup() {
  size(400, 200);
  // 2. Створюємо об'єкти конструктором
  redCar  = new Car(color(255, 0, 0), 0, 60, 2);
  blueCar = new Car(color(0, 0, 255), 0, 140, 1);
}

void draw() {
  background(255);
  // 3. Викликаємо методи
  redCar.move();
  redCar.display();
  blueCar.move();
  blueCar.display();
}
