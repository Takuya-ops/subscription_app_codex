import 'package:flutter/material.dart';

import '../data/ui_catalog.dart';
import '../domain/ui_pattern.dart';
import '../state/app_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/atlas_widgets.dart';
import 'pattern_detail_screen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({required this.controller, super.key});

  final AppController controller;

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen>
    with AutomaticKeepAliveClientMixin {
  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();
  String _query = '';
  UiCategory? _category;
  PlatformScope? _platform;

  @override
  bool get wantKeepAlive => true;

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _clearFilters() {
    setState(() {
      _query = '';
      _category = null;
      _platform = null;
      _searchController.clear();
    });
    _searchFocus.requestFocus();
  }

  Future<void> _openPattern(UiPattern pattern, List<UiPattern> visible) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => PatternDetailScreen(
          controller: widget.controller,
          patterns: visible,
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
        final visible = filterPatterns(
          query: _query,
          category: _category,
          platform: _platform,
        );
        return Scaffold(
          backgroundColor: AtlasColors.canvas,
          body: CustomScrollView(
            key: const PageStorageKey('catalog-scroll'),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
                sliver: SliverList.list(
                  children: [
                    const AtlasBrand(),
                    const SizedBox(height: 30),
                    const SectionLabel('WEB & MOBILE UI LIBRARY'),
                    const SizedBox(height: 9),
                    Text(
                      '触ってわかる、\nUIの使い分け。',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '名前だけでなく、いつ使い、いつ避けるかまで。実在アプリの例とライブデモで学べます。',
                      style: Theme.of(context).textTheme.bodyLarge
                          ?.copyWith(color: AtlasColors.muted),
                    ),
                    const SizedBox(height: 22),
                    ProgressOverview(
                      completed: widget.controller.completedCount,
                      total: uiPatterns.length,
                    ),
                    const SizedBox(height: 22),
                    TextField(
                      key: const Key('catalog-search'),
                      controller: _searchController,
                      focusNode: _searchFocus,
                      textInputAction: TextInputAction.search,
                      autocorrect: false,
                      onChanged: (value) => setState(() => _query = value),
                      decoration: InputDecoration(
                        labelText: 'UIを検索',
                        hintText: '名前・用途・アプリ名',
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon: _query.isEmpty
                            ? null
                            : IconButton(
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _query = '');
                                  _searchFocus.requestFocus();
                                },
                                tooltip: '検索語を消去',
                                icon: const Icon(Icons.close_rounded),
                              ),
                      ),
                    ),
                    const SizedBox(height: 15),
                    Semantics(
                      label: 'プラットフォームで絞り込む',
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          ChoiceChip(
                            label: const Text('すべて'),
                            selected: _platform == null,
                            onSelected: (_) => setState(() => _platform = null),
                          ),
                          ChoiceChip(
                            label: const Text('Web'),
                            selected: _platform == PlatformScope.web,
                            onSelected: (_) =>
                                setState(() => _platform = PlatformScope.web),
                          ),
                          ChoiceChip(
                            label: const Text('スマホ'),
                            selected: _platform == PlatformScope.mobile,
                            onSelected: (_) => setState(
                              () => _platform = PlatformScope.mobile,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 52,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: categories.length + 1,
                        separatorBuilder: (_, _) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          if (index == 0) {
                            return FilterChip(
                              label: Text('すべて ${uiPatterns.length}'),
                              selected: _category == null,
                              onSelected: (_) =>
                                  setState(() => _category = null),
                            );
                          }
                          final category = categories[index - 1];
                          final count = uiPatterns
                              .where((pattern) => pattern.category == category)
                              .length;
                          return FilterChip(
                            label: Text('${category.shortLabel} $count'),
                            selected: _category == category,
                            onSelected: (_) =>
                                setState(() => _category = category),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 15),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${visible.length} PATTERNS',
                            style: const TextStyle(
                              color: AtlasColors.ink,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.7,
                            ),
                          ),
                        ),
                        if (_query.isNotEmpty ||
                            _category != null ||
                            _platform != null)
                          TextButton(
                            onPressed: _clearFilters,
                            child: const Text('条件を解除'),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
              if (visible.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: AtlasEmptyState(
                    icon: Icons.search_off_rounded,
                    title: '一致するUIがありません',
                    message: '検索語や絞り込み条件を変えてください。',
                    actionLabel: '条件をすべて解除',
                    onAction: _clearFilters,
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 30),
                  sliver: SliverList.separated(
                    itemCount: visible.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final pattern = visible[index];
                      final catalogIndex = uiPatterns.indexWhere(
                        (item) => item.id == pattern.id,
                      );
                      return PatternTile(
                        key: ValueKey('pattern-${pattern.id}'),
                        pattern: pattern,
                        index: catalogIndex,
                        completed: widget.controller.isCompleted(pattern.id),
                        favorite: widget.controller.isFavorite(pattern.id),
                        onOpen: () => _openPattern(pattern, visible),
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
