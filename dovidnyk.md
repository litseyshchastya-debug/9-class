# Довідник Processing: шпаргалка та словник

## Структура скетчу
```java
// глобальні змінні
void setup() {      // один раз
  size(600, 400);
}
void draw() {       // щокадру
  background(255);
}
void mousePressed() { }   // події
void keyPressed() { }
```

## Малювання
| Функція | Опис |
|---|---|
| `size(w, h)` | розмір вікна (`P2D`, `P3D` — третій аргумент) |
| `background(c)` | заливка фону |
| `point(x, y)` | точка |
| `line(x1, y1, x2, y2)` | лінія |
| `rect(x, y, w, h)` / `rect(x, y, w, h, r)` | прямокутник / із заокругленими кутами |
| `ellipse(x, y, w, h)` / `circle(x, y, d)` | еліпс / коло |
| `triangle(...)`, `quad(...)` | трикутник, чотирикутник |
| `arc(x, y, w, h, start, stop)` | дуга |
| `beginShape()` `vertex(x, y)` `endShape(CLOSE)` | довільна фігура |
| `rectMode()` / `ellipseMode()` | `CORNER`, `CENTER`, `CORNERS`, `RADIUS` |

## Колір і стиль
| Функція | Опис |
|---|---|
| `fill(…)` / `noFill()` | заливка |
| `stroke(…)` / `noStroke()` | контур |
| `strokeWeight(n)` | товщина лінії |
| `colorMode(RGB/HSB, max…)` | модель кольору |
| `color(r, g, b, a)` | створити колір |
| `red()`, `green()`, `blue()`, `alpha()`, `hue()`, `brightness()` | складові кольору |

Аргументи `fill`/`stroke`/`background`: `(сірий)`, `(сірий, альфа)`, `(r, g, b)`, `(r, g, b, альфа)`, `(#RRGGBB)`.

## Системні змінні
`width`, `height`, `mouseX`, `mouseY`, `pmouseX`, `pmouseY`, `mousePressed`, `mouseButton`, `keyPressed`, `key`, `keyCode`, `frameCount`, `frameRate`

## Математика
| Функція | Опис |
|---|---|
| `random(max)`, `random(min, max)` | випадкове `float` |
| `noise(t)` | шум Перліна (0…1) |
| `map(v, a1, b1, a2, b2)` | перерахунок діапазону |
| `constrain(v, min, max)` | обмеження значення |
| `dist(x1, y1, x2, y2)` | відстань |
| `abs()`, `sqrt()`, `pow()`, `min()`, `max()`, `round()`, `floor()`, `ceil()` | стандартні |
| `sin()`, `cos()`, `atan2()`, `radians()`, `degrees()` | тригонометрія |
| `PI`, `HALF_PI`, `QUARTER_PI`, `TWO_PI` | константи |
| `int(x)`, `float(x)`, `str(x)` | перетворення типів |

## Трансформації
`translate(x, y)`, `rotate(a)`, `scale(s)`, `pushMatrix()`, `popMatrix()`

## Зображення і текст
| Функція | Опис |
|---|---|
| `PImage img = loadImage("f.jpg");` | завантажити (у `setup()`) |
| `image(img, x, y)` / `image(img, x, y, w, h)` | показати |
| `tint()`, `noTint()`, `filter(GRAY / INVERT / BLUR / THRESHOLD / POSTERIZE)` | ефекти |
| `loadPixels()`, `pixels[x + y*width]`, `updatePixels()` | робота з пікселями |
| `get(x, y)` | колір пікселя |
| `text(s, x, y)`, `textSize(n)`, `textAlign()`, `textWidth(s)` | текст |
| `createFont("Arial", 32)`, `textFont(f)` | шрифт |

## Час і файли
`millis()`, `second()`, `minute()`, `hour()`, `day()`, `month()`, `year()`, `saveFrame("img-####.png")`, `save("img.png")`, `noLoop()`, `loop()`, `redraw()`, `frameRate(n)`

## Python → Processing (Java)
| Python | Processing |
|---|---|
| `x = 5` | `int x = 5;` |
| `if x > 5:` | `if (x > 5) { }` |
| `elif` / `else` | `else if` / `else` |
| `and`, `or`, `not` | `&&`, `\|\|`, `!` |
| `for i in range(10):` | `for (int i = 0; i < 10; i++) { }` |
| `while x < 10:` | `while (x < 10) { }` |
| `def f(a, b):` | `void f(int a, int b) { }` |
| `return x` у функції | `int f() { return x; }` |
| `a = [1, 2, 3]` | `int[] a = {1, 2, 3};` |
| `len(a)` | `a.length` (масив), `list.size()` (ArrayList) |
| `print("x =", x)` | `println("x = " + x);` |
| `class Ball:` + `__init__` | `class Ball { Ball() { } }` |
| `b = Ball()` | `Ball b = new Ball();` |
| `True` / `False` | `true` / `false` |
| `# коментар` | `// коментар` |

## Словник термінів
| English | Українською |
|---|---|
| sketch | скетч, програма |
| sketchbook | альбом скетчів (папка зі скетчами) |
| display window / canvas | вікно, полотно |
| pixel | піксель |
| stroke / fill | контур / заливка |
| variable / data type | змінна / тип даних |
| integer / floating point | ціле / дробове (з рухомою комою) |
| boolean | логічний тип |
| loop | цикл |
| conditional | умова, розгалуження |
| function / argument / parameter | функція / аргумент / параметр |
| return type | тип результату |
| event | подія |
| scope (global / local) | область видимості (глобальна / локальна) |
| class / object / instance | клас / об'єкт / екземпляр |
| field / method / constructor | поле / метод / конструктор |
| array / index | масив / індекс |
| particle system | система частинок |
| transformation | перетворення (трансформація) |
| recursion | рекурсія |
| Perlin noise | шум Перліна |
| generative art | генеративне мистецтво |
| debugging / bug | налагодження / помилка |
| syntax error | синтаксична помилка |
| frame / frame rate | кадр / частота кадрів |

## Типові помилки
| Повідомлення | Причина та виправлення |
|---|---|
| `missing a semicolon` | додайте `;` у кінці рядка |
| `The function … does not exist` | перевірте назву (регістр!) і кількість/типи аргументів |
| `Cannot find anything named "x"` | змінну не оголошено або вона локальна в іншій функції |
| `Type mismatch, "float" does not match with "int"` | `int x = random(5);` → `int x = int(random(5));` |
| `NullPointerException` | об'єкт не створено через `new` або файл не знайдено |
| `ArrayIndexOutOfBoundsException` | індекс поза межами масиву (`0 … length-1`) |
| нічого не рухається | змінну оголошено всередині `draw()` |
| кирилиця — «квадратики» | оберіть шрифт з кирилицею: `createFont("Arial", 32)` |
