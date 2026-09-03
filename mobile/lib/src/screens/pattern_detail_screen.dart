import 'package:flutter/material.dart';

import '../domain/ui_pattern.dart';
import '../state/app_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/atlas_widgets.dart';
import '../widgets/pattern_demo.dart';

class PatternDetailScreen extends StatefulWidget {
  const PatternDetailScreen({
    required this.controller,
    required this.patterns,
    required this.initialPatternId,
    super.key,
  }) : assert(patterns.length > 0);

  final AppController controller;
  final List<UiPattern> patterns;
  final String initialPatternId;

  @override
  State<PatternDetailScreen> createState() => _PatternDetailScreenState();
}

class _PatternDetailScreenState extends State<PatternDetailScreen> {
  final _scrollController = ScrollController();
  final _titleFocus = FocusNode(debugLabel: 'pattern-title');
  late int _index;

  UiPattern get _pattern => widget.patterns[_index];

  @override
  void initState() {
    super.initState();
    final initial = widget.patterns.indexWhere(
      (pattern) => pattern.id == widget.initialPatternId,
    );
    _index = initial < 0 ? 0 : initial;
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _titleFocus.dispose();
    super.dispose();
  }

  void _move(int offset) {
    final next =
        (_index + offset + widget.patterns.length) % widget.patterns.length;
    setState(() => _index = next);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final reduceMotion = MediaQuery.disableAnimationsOf(context);
      if (_scrollController.hasClients) {
        if (reduceMotion) {
          _scrollController.jumpTo(0);
        } else {
          _scrollController.animateTo(
            0,
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
          );
        }
      }
      _titleFocus.requestFocus();
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final pattern = _pattern;
        final completed = widget.controller.isCompleted(pattern.id);
        final favorite = widget.controller.isFavorite(pattern.id);
        return Scaffold(
          backgroundColor: AtlasColors.canvas,
          appBar: AppBar(
            leading: IconButton(
              onPressed: () => Navigator.of(context).pop(),
              tooltip: '図鑑へ戻る',
              icon: const Icon(Icons.arrow_back_rounded),
            ),
            title: Text('${_index + 1} / ${widget.patterns.length}'),
            actions: [
              IconButton(
                onPressed: () => widget.controller.toggleFavorite(pattern.id),
                tooltip: favorite ? 'お気に入りから外す' : 'お気に入りに追加',
                isSelected: favorite,
                selectedIcon: const Icon(
                  Icons.bookmark_rounded,
                  color: AtlasColors.blue,
                ),
                icon: const Icon(Icons.bookmark_border_rounded),
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: CustomScrollView(
            key: ValueKey('detail-${pattern.id}'),
            controller: _scrollController,
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 36),
                sliver: SliverList.list(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: SectionLabel(
                            'LESSON · ${pattern.category.label}',
                          ),
                        ),
                        PlatformPill(platform: pattern.platform),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Focus(
                      focusNode: _titleFocus,
                      child: Semantics(
                        header: true,
                        child: Text(
                          pattern.name,
                          style: Theme.of(context).textTheme.displaySmall,
                        ),
                      ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      pattern.english,
                      style: const TextStyle(
                        color: AtlasColors.blue,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      pattern.summary,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 22),
                    PatternDemo(key: ValueKey(pattern.id), pattern: pattern),
                    const SizedBox(height: 18),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final cards = [
                          InfoCard(
                            icon: Icons.check_circle_outline_rounded,
                            title: '使うとき',
                            text: pattern.useWhen,
                            tone: AtlasColors.success,
                          ),
                          InfoCard(
                            icon: Icons.warning_amber_rounded,
                            title: '避けるとき',
                            text: pattern.avoid,
                            tone: AtlasColors.warning,
                          ),
                        ];
                        if (constraints.maxWidth >= 680) {
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: cards[0]),
                              const SizedBox(width: 12),
                              Expanded(child: cards[1]),
                            ],
                          );
                        }
                        return Column(
                          children: [
                            cards[0],
                            const SizedBox(height: 12),
                            cards[1],
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 18),
                    _DetailSection(
                      label: 'DON’T CONFUSE',
                      title: '似たUIとの見分け方',
                      icon: Icons.compare_arrows_rounded,
                      child: Text(
                        pattern.compare,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ),
                    const SizedBox(height: 18),
                    _DetailSection(
                      label: 'REAL WORLD EXAMPLES',
                      title: '実在アプリでは',
                      icon: Icons.apps_rounded,
                      child: Column(
                        children: [
                          for (
                            var index = 0;
                            index < pattern.examples.length;
                            index++
                          )
                            Padding(
                              padding: EdgeInsets.only(
                                bottom: index == pattern.examples.length - 1
                                    ? 0
                                    : 9,
                              ),
                              child: Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF4F6FA),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 13,
                                ),
                                child: Row(
                                  children: [
                                    Text(
                                      '${index + 1}'.padLeft(2, '0'),
                                      style: const TextStyle(
                                        color: AtlasColors.blue,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        pattern.examples[index],
                                        style: const TextStyle(
                                          color: AtlasColors.ink,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          const SizedBox(height: 10),
                          Text(
                            '画面はOS・プラン・更新時期により変わることがあります。用途を手がかりに観察しましょう。',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: AtlasColors.muted),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      decoration: BoxDecoration(
                        color: AtlasColors.ink,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      padding: const EdgeInsets.all(19),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              color: AtlasColors.acid,
                              borderRadius: BorderRadius.circular(9),
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 7,
                            ),
                            child: const Text(
                              'A11Y',
                              style: TextStyle(
                                color: AtlasColors.ink,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(width: 13),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'アクセシビリティの要点',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 7),
                                Text(
                                  pattern.a11y,
                                  style: const TextStyle(
                                    color: Color(0xFFC8D1E3),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    height: 1.6,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _move(-1),
                            icon: const Icon(Icons.arrow_back_rounded),
                            label: const Text('前のUI'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: FilledButton.icon(
                            key: const Key('next-pattern'),
                            onPressed: () => _move(1),
                            iconAlignment: IconAlignment.end,
                            icon: const Icon(Icons.arrow_forward_rounded),
                            label: const Text('次のUI'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: SafeArea(
            top: false,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AtlasColors.line)),
              ),
              padding: const EdgeInsets.fromLTRB(18, 11, 18, 11),
              child: FilledButton.icon(
                key: const Key('toggle-completed'),
                onPressed: () => widget.controller.toggleCompleted(pattern.id),
                style: FilledButton.styleFrom(
                  backgroundColor: completed
                      ? const Color(0xFFE5F8F1)
                      : AtlasColors.blue,
                  foregroundColor: completed
                      ? AtlasColors.success
                      : Colors.white,
                ),
                icon: Icon(
                  completed
                      ? Icons.check_circle_rounded
                      : Icons.school_outlined,
                ),
                label: Text(completed ? '学習済み' : '学習済みにする'),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _DetailSection extends StatelessWidget {
  const _DetailSection({
    required this.label,
    required this.title,
    required this.icon,
    required this.child,
  });

  final String label;
  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionLabel(label),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(icon, color: AtlasColors.blue, size: 22),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}
