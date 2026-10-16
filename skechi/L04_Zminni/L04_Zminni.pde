// Урок 4. Змінні керують малюнком
// Змініть zoogX, zoogY або zoogScale — і весь персонаж зміниться.

int zoogX = 100;
int zoogY = 100;
float zoogScale = 1.0;

size(200, 200);
background(255);
rectMode(CENTER);

// Тіло
fill(150);
rect(zoogX, zoogY, 20 * zoogScale, 100 * zoogScale);

// Голова
fill(255);
ellipse(zoogX, zoogY - 30 * zoogScale, 60 * zoogScale, 60 * zoogScale);

// Очі
fill(0);
ellipse(zoogX - 19 * zoogScale, zoogY - 30 * zoogScale, 16 * zoogScale, 32 * zoogScale);
ellipse(zoogX + 19 * zoogScale, zoogY - 30 * zoogScale, 16 * zoogScale, 32 * zoogScale);

// Ноги
line(zoogX - 10 * zoogScale, zoogY + 50 * zoogScale, zoogX - 20 * zoogScale, zoogY + 60 * zoogScale);
line(zoogX + 10 * zoogScale, zoogY + 50 * zoogScale, zoogX + 20 * zoogScale, zoogY + 60 * zoogScale);

// Пастка цілочисельного ділення
println("7 / 2 = " + (7 / 2));
println("7.0 / 2 = " + (7.0 / 2));
println("7 % 2 = " + (7 % 2));
println("Відстань: " + dist(0, 0, 3, 4));
