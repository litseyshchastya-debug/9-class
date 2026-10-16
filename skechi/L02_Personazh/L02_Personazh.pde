// Урок 2. Персонаж Зуг (за прикладом Д. Шиффмана)

size(200, 200);
background(255);
rectMode(CENTER);
ellipseMode(CENTER);

// Тіло
stroke(0);
fill(150);
rect(100, 100, 20, 100);

// Голова
fill(255);
ellipse(100, 70, 60, 60);

// Очі
fill(0);
ellipse(81, 70, 16, 32);
ellipse(119, 70, 16, 32);

// Ноги
line(90, 150, 80, 160);
line(110, 150, 120, 160);
