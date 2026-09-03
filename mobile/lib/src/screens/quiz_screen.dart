import 'package:flutter/material.dart';

import '../data/quiz_data.dart';
import '../state/app_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/atlas_widgets.dart';

class QuizScreen extends StatefulWidget {
  const QuizScreen({required this.controller, super.key});

  final AppController controller;

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen>
    with AutomaticKeepAliveClientMixin {
  int _questionIndex = 0;
  int _score = 0;
  String? _selectedAnswer;
  bool _checked = false;
  bool _finished = false;

  @override
  bool get wantKeepAlive => true;

  QuizQuestion get _question => quizQuestions[_questionIndex];
  bool get _isCorrect => _selectedAnswer == _question.answer;

  void _checkAnswer() {
    if (_selectedAnswer == null || _checked) return;
    final correct = _selectedAnswer == _question.answer;
    setState(() {
      _checked = true;
      if (correct) _score += 1;
    });
    if (correct) widget.controller.markCompleted(_question.answer);
  }

  void _next() {
    if (!_checked) return;
    if (_questionIndex == quizQuestions.length - 1) {
      setState(() => _finished = true);
      return;
    }
    setState(() {
      _questionIndex += 1;
      _selectedAnswer = null;
      _checked = false;
    });
  }

  void _restart() {
    setState(() {
      _questionIndex = 0;
      _score = 0;
      _selectedAnswer = null;
      _checked = false;
      _finished = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: AtlasColors.canvas,
      appBar: AppBar(toolbarHeight: 72, title: const AtlasBrand(compact: true)),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 260),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        child: _finished ? _buildResult(context) : _buildQuestion(context),
      ),
    );
  }

  Widget _buildQuestion(BuildContext context) {
    final progress = (_questionIndex + 1) / quizQuestions.length;
    return SingleChildScrollView(
      key: ValueKey('question-$_questionIndex'),
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionLabel('DECISION QUIZ'),
          const SizedBox(height: 8),
          Text(
            '状況から、UIを選ぶ。',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            '見た目ではなく、目的・候補数・反映タイミングから判断します。',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 22),
          Semantics(
            label:
                '問題${_questionIndex + 1}、全${quizQuestions.length}問、現在$_score問正解',
            child: Column(
              children: [
                Row(
                  children: [
                    Text(
                      '${_questionIndex + 1} / ${quizQuestions.length}',
                      style: const TextStyle(
                        color: AtlasColors.blue,
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '$_score 正解',
                      style: const TextStyle(
                        color: AtlasColors.muted,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 9),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 8,
                    color: AtlasColors.blue,
                    backgroundColor: const Color(0xFFDCE2EE),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 22, 18, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SectionLabel('SCENARIO'),
                  const SizedBox(height: 10),
                  Semantics(
                    header: true,
                    child: Text(
                      _question.situation,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _question.detail,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 22),
                  Text(
                    '最適なUIを一つ選んでください',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 10),
                  RadioGroup<String>(
                    groupValue: _selectedAnswer,
                    onChanged: (value) {
                      if (!_checked && value != null) {
                        setState(() => _selectedAnswer = value);
                      }
                    },
                    child: Column(
                      children: [
                        for (
                          var index = 0;
                          index < _question.choices.length;
                          index++
                        )
                          Padding(
                            padding: const EdgeInsets.only(bottom: 9),
                            child: _QuizChoiceTile(
                              choice: _question.choices[index],
                              letter: String.fromCharCode(65 + index),
                              selected:
                                  _selectedAnswer ==
                                  _question.choices[index].id,
                              checked: _checked,
                              correctId: _question.answer,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (_checked) ...[
                    const SizedBox(height: 10),
                    Semantics(
                      liveRegion: true,
                      container: true,
                      label: _isCorrect
                          ? '正解です。${_question.explanation}'
                          : '不正解です。${_question.explanation}',
                      child: Container(
                        decoration: BoxDecoration(
                          color: _isCorrect
                              ? const Color(0xFFE6F8F1)
                              : const Color(0xFFFFF0E5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _isCorrect
                                ? const Color(0xFFB5E6D5)
                                : const Color(0xFFF1C79F),
                          ),
                        ),
                        padding: const EdgeInsets.all(15),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              _isCorrect
                                  ? Icons.check_circle_rounded
                                  : Icons.lightbulb_rounded,
                              color: _isCorrect
                                  ? AtlasColors.success
                                  : AtlasColors.warning,
                            ),
                            const SizedBox(width: 11),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _isCorrect ? 'その判断で正解です' : 'ここを見分けよう',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium,
                                  ),
                                  const SizedBox(height: 5),
                                  Text(
                                    _question.explanation,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 18),
                  FilledButton(
                    key: const Key('quiz-primary-action'),
                    onPressed: _checked
                        ? _next
                        : (_selectedAnswer == null ? null : _checkAnswer),
                    child: Text(
                      !_checked
                          ? '回答する'
                          : _questionIndex == quizQuestions.length - 1
                          ? '結果を見る'
                          : '次の問題',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResult(BuildContext context) {
    final percent = (_score / quizQuestions.length * 100).round();
    final message = _score == quizQuestions.length
        ? 'すばらしい判断です。'
        : _score >= 6
        ? 'かなり身についています。'
        : '比較しながら復習しましょう。';

    return SingleChildScrollView(
      key: const ValueKey('quiz-result'),
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionLabel('DECISION QUIZ · RESULT'),
          const SizedBox(height: 24),
          Center(
            child: Semantics(
              label: '結果、${quizQuestions.length}問中$_score問正解、$percentパーセント',
              child: SizedBox(
                width: 174,
                height: 174,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox.expand(
                      child: CircularProgressIndicator(
                        value: _score / quizQuestions.length,
                        strokeWidth: 14,
                        color: AtlasColors.blue,
                        backgroundColor: const Color(0xFFDCE3EF),
                        strokeCap: StrokeCap.round,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$_score',
                          style: Theme.of(context).textTheme.displaySmall,
                        ),
                        Text(
                          '/ ${quizQuestions.length}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 28),
          Text(
            message,
            style: Theme.of(context).textTheme.headlineMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            'UIは見た目ではなく、ユーザーの目的・候補数・反映タイミングから選ぶのがコツです。正解したUIは学習済みに保存されました。',
            style: Theme.of(context).textTheme.bodyLarge
                ?.copyWith(color: AtlasColors.muted),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 26),
          FilledButton.icon(
            onPressed: _restart,
            icon: const Icon(Icons.replay_rounded),
            label: const Text('もう一度挑戦する'),
          ),
        ],
      ),
    );
  }
}

class _QuizChoiceTile extends StatelessWidget {
  const _QuizChoiceTile({
    required this.choice,
    required this.letter,
    required this.selected,
    required this.checked,
    required this.correctId,
  });

  final QuizChoice choice;
  final String letter;
  final bool selected;
  final bool checked;
  final String correctId;

  @override
  Widget build(BuildContext context) {
    final isCorrect = checked && choice.id == correctId;
    final isWrong = checked && selected && !isCorrect;
    final borderColor = isCorrect
        ? AtlasColors.success
        : isWrong
        ? AtlasColors.danger
        : selected
        ? AtlasColors.blue
        : AtlasColors.line;
    final background = isCorrect
        ? const Color(0xFFE9F8F2)
        : isWrong
        ? const Color(0xFFFFEEEE)
        : selected
        ? const Color(0xFFEEF2FF)
        : Colors.white;

    return Material(
      color: background,
      shape: RoundedRectangleBorder(
        side: BorderSide(
          color: borderColor,
          width: selected || isCorrect ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      clipBehavior: Clip.antiAlias,
      child: RadioListTile<String>(
        value: choice.id,
        enabled: !checked,
        activeColor: isCorrect ? AtlasColors.success : AtlasColors.blue,
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        title: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFFF0F3F8),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Text(
                letter,
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                choice.label,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
            if (isCorrect)
              const Icon(
                Icons.check_circle_rounded,
                color: AtlasColors.success,
              ),
            if (isWrong)
              const Icon(Icons.cancel_rounded, color: AtlasColors.danger),
          ],
        ),
      ),
    );
  }
}
