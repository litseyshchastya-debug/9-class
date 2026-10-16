// Урок 2. Базові фігури та атрибути малювання

size(600, 400);
background(240);

// Рядок 1: базові фігури
strokeWeight(2);
stroke(0);
fill(255);
point(40, 60);
line(70, 30, 150, 90);
rect(180, 30, 100, 60);
ellipse(350, 60, 100, 60);
triangle(440, 90, 490, 30, 540, 90);

// Рядок 2: режими CENTER — фігури вирівняні по одній осі
rectMode(CENTER);
fill(200);
rect(100, 200, 120, 80);
ellipse(100, 200, 60, 60);

// Товщина та форма кінців ліній
strokeWeight(12);
strokeCap(ROUND);   line(220, 170, 320, 170);
strokeCap(SQUARE);  line(220, 200, 320, 200);
strokeCap(PROJECT); line(220, 230, 320, 230);

// Дуги: кути в радіанах
strokeWeight(2);
fill(255, 220, 0);
arc(420, 200, 100, 100, QUARTER_PI, TWO_PI - QUARTER_PI, PIE);   // «Пакмен»
noFill();
arc(530, 200, 80, 80, 0, PI);                                    // нижня половина кола

// Довільна фігура: зірка
fill(255);
beginShape();
vertex(300, 280);
vertex(318, 330);
vertex(370, 330);
vertex(328, 360);
vertex(345, 395);
vertex(300, 372);
vertex(255, 395);
vertex(272, 360);
vertex(230, 330);
vertex(282, 330);
endShape(CLOSE);
