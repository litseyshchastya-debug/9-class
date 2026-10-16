// Урок 3. Колір: HSB-веселка та змішування RGB з прозорістю

size(600, 400);
background(255);
noStroke();

// Веселка в моделі HSB: змінюється лише відтінок (Hue)
colorMode(HSB, 360, 100, 100);
float stripeW = width / 7.0;
for (int i = 0; i < 7; i++) {
  fill(i * 45, 90, 100);          // відтінок 0°, 45°, 90°, ...
  rect(i * stripeW, 0, stripeW, 150);
}

// Змішування світла RGB з альфа-каналом
colorMode(RGB, 255);
fill(255, 0, 0, 130);  ellipse(250, 260, 160, 160);
fill(0, 255, 0, 130);  ellipse(350, 260, 160, 160);
fill(0, 0, 255, 130);  ellipse(300, 330, 160, 160);

// Колір у змінній та шістнадцятковий запис
color orange = #FF8800;
fill(orange);
rect(500, 330, 60, 40);
println("Червона складова: " + red(orange) + ", зелена: " + green(orange));
