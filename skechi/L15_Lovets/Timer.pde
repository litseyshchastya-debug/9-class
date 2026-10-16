// Таймер на основі millis()

class Timer {
  int savedTime;
  int totalTime;

  Timer(int tempTotalTime) {
    totalTime = tempTotalTime;
  }

  void start() {
    savedTime = millis();
  }

  boolean isFinished() {
    return millis() - savedTime > totalTime;
  }
}
