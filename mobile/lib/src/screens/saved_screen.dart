import 'package:flutter/material.dart';

import '../data/ui_catalog.dart';
import '../domain/ui_pattern.dart';
import '../state/app_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/atlas_widgets.dart';
import 'pattern_detail_screen.dart';

enum _SavedMode { favorites, completed }

class SavedScreen extends StatefulWidget {
  const SavedScreen({required this.controller, super.key});

  final AppController controller;

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen>
    with AutomaticKeepAliveClientMixin {
  _SavedMode _mode = _SavedMode.favorites;

  @override
  bool get wantKeepAlive => true;

  Future<void> _openPattern(UiPattern pattern, List<UiPattern> patterns) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => PatternDetailScreen(
          controller: widget.controller,
          patterns: patterns,
          initialPatternId: pattern.id,
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final items = uiPatterns
            .where((pattern) {
              return _mode == _SavedMode.favorites
                  ? widget.controller.isFavorite(pattern.id)
                  : widget.controller.isCompleted(pattern.id);
            })
            .toList(growable: false);

        return Scaffold(
          backgroundColor: AtlasColors.canvas,
          appBar: AppBar(
            toolbarHeight: 72,
            title: const AtlasBrand(compact: true),
          ),
          body: CustomScrollView(
            key: PageStorageKey('saved-${_mode.name}'),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(18, 10, 18, 14),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '保存したUI',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 7),
                      Text(
                        '気になるUIと学習済みの教材は、この端末に保存されます。',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        child: SegmentedButton<_SavedMode>(
                          showSelectedIcon: false,
                          segments: [
                            ButtonSegment(
                              value: _SavedMode.favorites,
                              icon: const Icon(Icons.bookmark_rounded),
                              label: Text(
                                'お気に入り ${widget.controller.favoriteCount}',
                              ),
                            ),
                            ButtonSegment(
                              value: _SavedMode.completed,
                              icon: const Icon(Icons.check_circle_rounded),
                              label: Text(
                                '学習済み ${widget.controller.completedCount}',
                              ),
                            ),
                          ],
                          selected: {_mode},
                          onSelectionChanged: (value) =>
                              setState(() => _mode = value.single),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (items.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: AtlasEmptyState(
                    icon: _mode == _SavedMode.favorites
                        ? Icons.bookmark_add_outlined
                        : Icons.school_outlined,
                    title: _mode == _SavedMode.favorites
                        ? 'お気に入りはまだありません'
                        : '学習済みはまだありません',
                    message: _mode == _SavedMode.favorites
                        ? '図鑑のしおりアイコンを押すと、ここからすぐ開けます。'
                        : '教材を開いて「学習済みにする」を押すと、ここに追加されます。',
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(18, 4, 18, 30),
                  sliver: SliverList.separated(
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final pattern = items[index];
                      final catalogIndex = uiPatterns.indexWhere(
                        (item) => item.id == pattern.id,
                      );
                      return PatternTile(
                        pattern: pattern,
                        index: catalogIndex,
                        completed: widget.controller.isCompleted(pattern.id),
                        favorite: widget.controller.isFavorite(pattern.id),
                        onOpen: () => _openPattern(pattern, items),
                        onToggleFavorite: () =>
                            widget.controller.toggleFavorite(pattern.id),
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
