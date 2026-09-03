import 'dart:ui' as ui;
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../domain/ui_pattern.dart';
import '../theme/app_theme.dart';
import 'atlas_widgets.dart';

const supportedDemoIds = <String>{
  'button',
  'link',
  'icon-button',
  'menu-button',
  'fab',
  'toolbar',
  'command-palette',
  'text-field',
  'textarea',
  'search-field',
  'password-field',
  'otp',
  'number-stepper',
  'date-picker',
  'file-uploader',
  'slider',
  'autocomplete',
  'rich-text',
  'checkbox',
  'radio',
  'switch',
  'select',
  'combobox',
  'chip',
  'segmented',
  'rating',
  'top-nav',
  'side-nav',
  'nav-drawer',
  'bottom-nav',
  'tabs',
  'breadcrumbs',
  'pagination',
  'step-indicator',
  'inpage-nav',
  'back-up',
  'tree-nav',
  'inline-validation',
  'alert-banner',
  'toast',
  'spinner',
  'progress-bar',
  'skeleton',
  'badge',
  'empty-state',
  'save-status',
  'error-retry',
  'tooltip',
  'popover',
  'context-menu',
  'modal',
  'alert-dialog',
  'bottom-sheet',
  'side-sheet',
  'accordion',
  'disclosure',
  'lightbox',
  'coachmark',
  'list',
  'card',
  'table',
  'data-grid',
  'tree-view',
  'metric',
  'chart',
  'timeline',
  'calendar',
  'carousel',
  'map',
  'kanban',
  'tag',
  'responsive-grid',
  'app-shell',
  'master-detail',
  'split-view',
  'sticky',
  'masonry',
  'scroll-container',
  'safe-area',
  'thumb-reach',
  'keyboard-avoidance',
  'permission-prompt',
  'share-sheet',
  'biometric',
  'haptics',
  'notification-deeplink',
  'offline-sync',
  'tap',
  'double-tap',
  'long-press',
  'swipe-action',
  'swipe-dismiss',
  'edge-swipe',
  'drag-drop',
  'reorder',
  'pan',
  'pinch',
  'pull-refresh',
  'scrub',
};

class PatternDemo extends StatefulWidget {
  const PatternDemo({required this.pattern, super.key});

  final UiPattern pattern;

  @override
  State<PatternDemo> createState() => _PatternDemoState();
}

class _PatternDemoState extends State<PatternDemo> {
  bool _enabled = false;
  bool _secondary = false;
  bool _open = false;
  int _count = 0;
  int _selected = 0;
  double _value = 0.45;
  String _text = '';
  String _status = '操作して挙動を確かめてください';
  DateTime _date = DateTime(2026, 9, 4);
  final Set<int> _selectedItems = <int>{};
  final List<bool> _expanded = [false, false, false];
  final List<String> _items = ['企画', 'デザイン', '実装'];
  final TransformationController _transformationController =
      TransformationController();
  final ScrollController _innerScrollController = ScrollController();
  Offset _marker = const Offset(0.62, 0.42);
  double _dragX = 0;

  @override
  void dispose() {
    _transformationController.dispose();
    _innerScrollController.dispose();
    super.dispose();
  }

  void _setStatus(String value) {
    if (!mounted) return;
    setState(() => _status = value);
  }

  @override
  Widget build(BuildContext context) {
    assert(supportedDemoIds.contains(widget.pattern.id));
    return Card(
      color: const Color(0xFFEFF3FA),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                children: [
                  Expanded(child: SectionLabel('LIVE DEMO')),
                  Icon(
                    Icons.touch_app_rounded,
                    color: AtlasColors.blue,
                    size: 20,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 184),
              child: Material(
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: AtlasColors.line),
                ),
                clipBehavior: Clip.antiAlias,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: _buildDemo(context),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Semantics(
              liveRegion: true,
              label: _status,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 2),
                    child: Icon(
                      Icons.info_outline_rounded,
                      color: AtlasColors.muted,
                      size: 17,
                    ),
                  ),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      _status,
                      style: const TextStyle(
                        color: AtlasColors.muted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemo(BuildContext context) {
    return switch (widget.pattern.id) {
      'button' => _center(
        FilledButton.icon(
          onPressed: () {
            setState(() => _count += 1);
            _setStatus('ボタンを$_count回実行しました');
          },
          icon: const Icon(Icons.add_rounded),
          label: Text(_count == 0 ? '項目を作成' : 'もう一度実行'),
        ),
      ),
      'link' => _center(
        TextButton.icon(
          onPressed: () => _setStatus('「用語集」へ移動する想定です'),
          iconAlignment: IconAlignment.end,
          icon: const Icon(Icons.open_in_new_rounded, size: 18),
          label: const Text(
            '用語集を見る',
            style: TextStyle(decoration: TextDecoration.underline),
          ),
        ),
      ),
      'icon-button' => _center(
        IconButton.filled(
          onPressed: () {
            setState(() => _enabled = !_enabled);
            _setStatus(_enabled ? '再生しました' : '一時停止しました');
          },
          tooltip: _enabled ? '一時停止' : '再生',
          iconSize: 30,
          icon: Icon(_enabled ? Icons.pause_rounded : Icons.play_arrow_rounded),
        ),
      ),
      'menu-button' => _center(
        PopupMenuButton<String>(
          onSelected: (value) => _setStatus('「$value」を選びました'),
          itemBuilder: (_) => const [
            PopupMenuItem(value: '編集', child: Text('編集')),
            PopupMenuItem(value: '複製', child: Text('複製')),
            PopupMenuItem(value: '削除', child: Text('削除')),
          ],
          child: const _DemoButtonFace(
            icon: Icons.more_horiz_rounded,
            label: 'その他の操作',
          ),
        ),
      ),
      'fab' => _phoneFrame(
        Stack(
          children: [
            const Positioned.fill(child: _FaintRows()),
            Positioned(
              right: 8,
              bottom: 8,
              child: FloatingActionButton.extended(
                heroTag: null,
                onPressed: () => _setStatus('新規作成を開始しました'),
                icon: const Icon(Icons.edit_rounded),
                label: const Text('作成'),
              ),
            ),
          ],
        ),
      ),
      'toolbar' => _center(
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ToggleButtons(
              borderRadius: BorderRadius.circular(11),
              isSelected: [_enabled, _secondary, _open],
              onPressed: (index) => setState(() {
                if (index == 0) _enabled = !_enabled;
                if (index == 1) _secondary = !_secondary;
                if (index == 2) _open = !_open;
                _status = '選択中の文字へ書式を反映しました';
              }),
              children: const [
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 13),
                  child: Icon(Icons.format_bold_rounded),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 13),
                  child: Icon(Icons.format_italic_rounded),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 13),
                  child: Icon(Icons.format_underlined_rounded),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              '編集するテキスト',
              style: TextStyle(
                fontWeight: _enabled ? FontWeight.w900 : FontWeight.w500,
                fontStyle: _secondary ? FontStyle.italic : FontStyle.normal,
                decoration: _open ? TextDecoration.underline : null,
              ),
            ),
          ],
        ),
      ),
      'command-palette' => _commandPalette(),
      'text-field' => _textField(label: 'ページ名', hint: '例：UI調査メモ'),
      'textarea' => _textField(label: 'コメント', hint: '気づいたことを入力', maxLines: 3),
      'search-field' => _searchDemo(),
      'password-field' => _passwordDemo(),
      'otp' => _otpDemo(),
      'number-stepper' => _numberStepper(),
      'date-picker' => _datePicker(context),
      'file-uploader' => _fileUploader(),
      'slider' => _sliderDemo(
        label: '音量',
        suffix: '${(_value * 100).round()}%',
      ),
      'autocomplete' => _autocompleteDemo(
        label: '目的地',
        values: const ['東京都', '東京駅', '東京タワー'],
      ),
      'rich-text' => _richTextDemo(),
      'checkbox' => _checkboxDemo(),
      'radio' => _radioDemo(),
      'switch' => _switchDemo(),
      'select' => _selectDemo(),
      'combobox' => _autocompleteDemo(
        label: '担当者',
        values: const ['佐藤 葵', '鈴木 海', '高橋 凛'],
      ),
      'chip' => _chipDemo(),
      'segmented' => _segmentedDemo(),
      'rating' => _ratingDemo(),
      'top-nav' => _topNavigationDemo(),
      'side-nav' => _sideNavigationDemo(),
      'nav-drawer' => _navigationDrawerDemo(),
      'bottom-nav' => _bottomNavigationDemo(),
      'tabs' => _tabsDemo(),
      'breadcrumbs' => _breadcrumbsDemo(),
      'pagination' => _paginationDemo(),
      'step-indicator' => _stepDemo(),
      'inpage-nav' => _inPageDemo(),
      'back-up' => _backUpDemo(),
      'tree-nav' => _treeDemo(navigation: true),
      'inline-validation' => _validationDemo(),
      'alert-banner' => _bannerDemo(),
      'toast' => _toastDemo(context),
      'spinner' => _spinnerDemo(),
      'progress-bar' => _progressDemo(),
      'skeleton' => _skeletonDemo(),
      'badge' => _badgeDemo(),
      'empty-state' => _emptyStateDemo(),
      'save-status' => _saveStatusDemo(),
      'error-retry' => _errorRetryDemo(),
      'tooltip' => _tooltipDemo(),
      'popover' => _popoverDemo(),
      'context-menu' => _contextMenuDemo(context),
      'modal' => _modalDemo(context),
      'alert-dialog' => _alertDialogDemo(context),
      'bottom-sheet' => _bottomSheetDemo(context),
      'side-sheet' => _sideSheetDemo(context),
      'accordion' => _accordionDemo(),
      'disclosure' => _disclosureDemo(),
      'lightbox' => _lightboxDemo(context),
      'coachmark' => _coachmarkDemo(),
      'list' => _listDemo(),
      'card' => _cardDemo(),
      'table' => _tableDemo(editable: false),
      'data-grid' => _tableDemo(editable: true),
      'tree-view' => _treeDemo(navigation: false),
      'metric' => _metricDemo(),
      'chart' => _chartDemo(),
      'timeline' => _timelineDemo(),
      'calendar' => _calendarDemo(),
      'carousel' => _carouselDemo(),
      'map' => _mapDemo(),
      'kanban' => _kanbanDemo(),
      'tag' => _tagDemo(),
      'responsive-grid' => _responsiveGridDemo(),
      'app-shell' => _appShellDemo(),
      'master-detail' => _masterDetailDemo(),
      'split-view' => _splitViewDemo(),
      'sticky' => _scrollDemo(sticky: true),
      'masonry' => _masonryDemo(),
      'scroll-container' => _scrollDemo(sticky: false),
      'safe-area' => _safeAreaDemo(),
      'thumb-reach' => _thumbReachDemo(),
      'keyboard-avoidance' => _keyboardAvoidanceDemo(),
      'permission-prompt' => _permissionDemo(context),
      'share-sheet' => _shareSheetDemo(context),
      'biometric' => _biometricDemo(context),
      'haptics' => _hapticsDemo(),
      'notification-deeplink' => _notificationDemo(),
      'offline-sync' => _offlineDemo(),
      'tap' => _tapDemo(),
      'double-tap' => _doubleTapDemo(),
      'long-press' => _longPressDemo(context),
      'swipe-action' => _swipeDemo(action: true),
      'swipe-dismiss' => _swipeDemo(action: false),
      'edge-swipe' => _edgeSwipeDemo(),
      'drag-drop' => _dragDropDemo(),
      'reorder' => _reorderDemo(),
      'pan' => _interactiveViewerDemo(allowScale: false),
      'pinch' => _interactiveViewerDemo(allowScale: true),
      'pull-refresh' => _pullRefreshDemo(),
      'scrub' => _scrubDemo(),
      _ => const Center(child: Text('このデモは準備中です')),
    };
  }

  Widget _center(Widget child) => Center(child: child);

  Widget _phoneFrame(Widget child) {
    return Center(
      child: Container(
        width: 260,
        height: 205,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: const Color(0xFFF4F6FA),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFBFC8D8), width: 2),
        ),
        padding: const EdgeInsets.fromLTRB(9, 18, 9, 9),
        child: child,
      ),
    );
  }

  Widget _textField({
    required String label,
    required String hint,
    int maxLines = 1,
  }) {
    return Center(
      child: TextField(
        maxLines: maxLines,
        textInputAction: maxLines > 1
            ? TextInputAction.newline
            : TextInputAction.done,
        onChanged: (value) => setState(() {
          _text = value;
          _status = value.isEmpty ? '入力待ちです' : '「$value」を入力中です';
        }),
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          helperText: '${_text.length}文字',
        ),
      ),
    );
  }

  Widget _commandPalette() {
    const commands = ['新しいページ', 'テーマを変更', '設定を開く'];
    final visible = commands
        .where((item) => normalizeSearch(item).contains(normalizeSearch(_text)))
        .toList();
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(
          onChanged: (value) => setState(() => _text = value),
          decoration: const InputDecoration(
            labelText: 'コマンドを検索',
            prefixIcon: Icon(Icons.terminal_rounded),
          ),
        ),
        const SizedBox(height: 8),
        for (final command in visible)
          ListTile(
            dense: true,
            leading: const Icon(Icons.bolt_rounded, color: AtlasColors.blue),
            title: Text(command),
            trailing: const Text('↵'),
            onTap: () => _setStatus('「$command」を実行しました'),
          ),
      ],
    );
  }

  Widget _searchDemo() {
    const options = ['トグル', 'ツールチップ', 'テーブル'];
    final results = options
        .where((item) => normalizeSearch(item).contains(normalizeSearch(_text)))
        .toList();
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          onChanged: (value) => setState(() {
            _text = value;
            _status = value.isEmpty ? '検索語を入力してください' : '「$value」で絞り込み中です';
          }),
          decoration: const InputDecoration(
            labelText: 'UIを検索',
            prefixIcon: Icon(Icons.search_rounded),
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 7,
          children: results.map((item) => Chip(label: Text(item))).toList(),
        ),
        if (results.isEmpty)
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text('一致するUIがありません'),
          ),
      ],
    );
  }

  Widget _passwordDemo() {
    return TextField(
      obscureText: !_enabled,
      onChanged: (value) => setState(() {
        _text = value;
        _status = value.isEmpty
            ? 'パスワードを入力してください'
            : '${value.length}文字入力されています';
      }),
      decoration: InputDecoration(
        labelText: 'パスワード',
        prefixIcon: const Icon(Icons.lock_outline_rounded),
        suffixIcon: IconButton(
          onPressed: () => setState(() {
            _enabled = !_enabled;
            _status = _enabled ? 'パスワードを表示しました' : 'パスワードを隠しました';
          }),
          tooltip: _enabled ? 'パスワードを隠す' : 'パスワードを表示',
          icon: Icon(
            _enabled ? Icons.visibility_off_rounded : Icons.visibility_rounded,
          ),
        ),
      ),
    );
  }

  Widget _otpDemo() {
    return Center(
      child: TextField(
        maxLength: 6,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w900,
          letterSpacing: 8,
        ),
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        onChanged: (value) => setState(() {
          _text = value;
          _status = value.length == 6
              ? '6桁のコードを入力しました'
              : 'あと${6 - value.length}桁です';
        }),
        decoration: const InputDecoration(
          labelText: '確認コード',
          hintText: '000000',
          counterText: '',
        ),
      ),
    );
  }

  Widget _numberStepper() {
    return _center(
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton.outlined(
            onPressed: _count <= 0
                ? null
                : () => setState(() {
                    _count -= 1;
                    _status = '$_count人を選択中です';
                  }),
            tooltip: '人数を減らす',
            icon: const Icon(Icons.remove_rounded),
          ),
          SizedBox(
            width: 90,
            child: Text(
              '$_count 人',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
          ),
          IconButton.filled(
            onPressed: _count >= 9
                ? null
                : () => setState(() {
                    _count += 1;
                    _status = '$_count人を選択中です';
                  }),
            tooltip: '人数を増やす',
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
    );
  }

  Widget _datePicker(BuildContext context) {
    return _center(
      OutlinedButton.icon(
        onPressed: () async {
          final selected = await showDatePicker(
            context: context,
            initialDate: _date,
            firstDate: DateTime(2020),
            lastDate: DateTime(2035),
            helpText: '日付を選択',
          );
          if (selected == null || !mounted) return;
          setState(() {
            _date = selected;
            _status =
                '${selected.year}年${selected.month}月${selected.day}日を選びました';
          });
        },
        icon: const Icon(Icons.calendar_month_rounded),
        label: Text('${_date.year}年${_date.month}月${_date.day}日'),
      ),
    );
  }

  Widget _fileUploader() {
    return InkWell(
      onTap: () => setState(() {
        _enabled = !_enabled;
        _status = _enabled ? 'design-note.pdf をアップロードしました' : 'ファイルを取り消しました';
      }),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFD),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AtlasColors.blue, style: BorderStyle.solid),
        ),
        child: Column(
          children: [
            Icon(
              _enabled ? Icons.check_circle_rounded : Icons.upload_file_rounded,
              color: _enabled ? AtlasColors.success : AtlasColors.blue,
              size: 35,
            ),
            const SizedBox(height: 9),
            Text(
              _enabled ? 'design-note.pdf' : 'タップしてファイルを選択',
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              _enabled ? 'アップロード完了' : 'PDF・画像、最大10MB',
              style: const TextStyle(color: AtlasColors.muted, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sliderDemo({required String label, required String suffix}) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
            Text(suffix),
          ],
        ),
        Slider(
          value: _value,
          onChanged: (value) => setState(() {
            _value = value;
            _status = '$labelを${(value * 100).round()}%にしました';
          }),
        ),
      ],
    );
  }

  Widget _autocompleteDemo({
    required String label,
    required List<String> values,
  }) {
    return Autocomplete<String>(
      optionsBuilder: (value) {
        final needle = normalizeSearch(value.text);
        if (needle.isEmpty) return const Iterable<String>.empty();
        return values.where((item) => normalizeSearch(item).contains(needle));
      },
      onSelected: (value) => _setStatus('「$value」を選択しました'),
      fieldViewBuilder: (context, controller, focusNode, onSubmitted) {
        return TextField(
          controller: controller,
          focusNode: focusNode,
          onSubmitted: (_) => onSubmitted(),
          decoration: InputDecoration(
            labelText: label,
            hintText: '文字を入力して候補を表示',
          ),
        );
      },
    );
  }

  Widget _richTextDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SegmentedButton<int>(
          multiSelectionEnabled: true,
          emptySelectionAllowed: true,
          showSelectedIcon: false,
          segments: const [
            ButtonSegment(
              value: 0,
              icon: Icon(Icons.format_bold_rounded),
              tooltip: '太字',
            ),
            ButtonSegment(
              value: 1,
              icon: Icon(Icons.format_italic_rounded),
              tooltip: '斜体',
            ),
            ButtonSegment(
              value: 2,
              icon: Icon(Icons.format_underlined_rounded),
              tooltip: '下線',
            ),
          ],
          selected: _selectedItems,
          onSelectionChanged: (value) => setState(() {
            _selectedItems
              ..clear()
              ..addAll(value);
            _status = '文章の書式を変更しました';
          }),
        ),
        const SizedBox(height: 18),
        Text(
          '書式を付けて伝える',
          style: TextStyle(
            fontSize: 18,
            fontWeight: _selectedItems.contains(0)
                ? FontWeight.w900
                : FontWeight.w500,
            fontStyle: _selectedItems.contains(1)
                ? FontStyle.italic
                : FontStyle.normal,
            decoration: _selectedItems.contains(2)
                ? TextDecoration.underline
                : null,
          ),
        ),
      ],
    );
  }

  Widget _checkboxDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CheckboxListTile(
          value: _enabled,
          onChanged: (value) => setState(() {
            _enabled = value ?? false;
            _status = _enabled ? 'メール通知を選択しました。まだ未保存です' : '選択を外しました';
          }),
          title: const Text('メール通知を受け取る'),
          subtitle: const Text('保存ボタンで確定するフォーム選択'),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
        ),
        FilledButton(
          onPressed: _enabled ? () => _setStatus('選択内容を保存しました') : null,
          child: const Text('設定を保存'),
        ),
      ],
    );
  }

  Widget _radioDemo() {
    const labels = ['通常配送', 'お急ぎ便', '日時指定'];
    return RadioGroup<int>(
      groupValue: _selected,
      onChanged: (value) => setState(() {
        _selected = value ?? 0;
        _status = '「${labels[_selected]}」を選択しました';
      }),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var index = 0; index < labels.length; index++)
            RadioListTile<int>(
              value: index,
              title: Text(labels[index]),
              contentPadding: EdgeInsets.zero,
              dense: true,
            ),
        ],
      ),
    );
  }

  Widget _switchDemo() {
    return SwitchListTile.adaptive(
      value: _enabled,
      onChanged: (value) => setState(() {
        _enabled = value;
        _status = value ? 'Wi‑Fiをすぐオンにしました' : 'Wi‑Fiをすぐオフにしました';
      }),
      title: const Text('Wi‑Fi', style: TextStyle(fontWeight: FontWeight.w800)),
      subtitle: Text(_enabled ? '接続中' : 'オフ'),
      secondary: Icon(_enabled ? Icons.wifi_rounded : Icons.wifi_off_rounded),
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _selectDemo() {
    const values = ['日本語', 'English', 'Español'];
    return DropdownButtonFormField<int>(
      isExpanded: true,
      initialValue: _selected,
      decoration: const InputDecoration(labelText: '表示言語'),
      items: [
        for (var index = 0; index < values.length; index++)
          DropdownMenuItem(value: index, child: Text(values[index])),
      ],
      onChanged: (value) => setState(() {
        _selected = value ?? 0;
        _status = '表示言語を${values[_selected]}にしました';
      }),
    );
  }

  Widget _chipDemo() {
    const labels = ['営業中', '評価4以上', '現在地周辺'];
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: [
        for (var index = 0; index < labels.length; index++)
          FilterChip(
            label: Text(labels[index]),
            selected: _selectedItems.contains(index),
            onSelected: (selected) => setState(() {
              selected
                  ? _selectedItems.add(index)
                  : _selectedItems.remove(index);
              _status = '${_selectedItems.length}件の条件で絞り込んでいます';
            }),
          ),
      ],
    );
  }

  Widget _segmentedDemo() {
    return _center(
      SegmentedButton<int>(
        showSelectedIcon: false,
        segments: const [
          ButtonSegment(
            value: 0,
            icon: Icon(Icons.view_list_rounded),
            label: Text('リスト'),
          ),
          ButtonSegment(
            value: 1,
            icon: Icon(Icons.grid_view_rounded),
            label: Text('グリッド'),
          ),
        ],
        selected: {_selected},
        onSelectionChanged: (value) => setState(() {
          _selected = value.single;
          _status = _selected == 0 ? 'リスト表示に切り替えました' : 'グリッド表示に切り替えました';
        }),
      ),
    );
  }

  Widget _ratingDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('満足度を選んでください'),
        const SizedBox(height: 9),
        Wrap(
          children: [
            for (var value = 1; value <= 5; value++)
              IconButton(
                onPressed: () => setState(() {
                  _count = value;
                  _status = '5段階中$valueを選択しました';
                }),
                tooltip: '$valueつ星',
                icon: Icon(
                  value <= _count
                      ? Icons.star_rounded
                      : Icons.star_border_rounded,
                  color: const Color(0xFFFFA41C),
                  size: 31,
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _topNavigationDemo() {
    final compact = MediaQuery.textScalerOf(context).scale(14) > 20;
    const destinations = [
      (label: 'ホーム', icon: Icons.home_outlined),
      (label: '検索', icon: Icons.search_rounded),
    ];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: AtlasColors.ink,
          borderRadius: BorderRadius.circular(13),
          child: Row(
            children: [
              const Expanded(
                child: Padding(
                  padding: EdgeInsets.all(12),
                  child: Text(
                    'Atlas',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              for (final (index, destination) in destinations.indexed)
                if (compact)
                  IconButton(
                    onPressed: () => setState(() {
                      _selected = index;
                      _status = '${destination.label}へ移動しました';
                    }),
                    tooltip: destination.label,
                    color: Colors.white,
                    icon: Icon(destination.icon),
                  )
                else
                  TextButton(
                    onPressed: () => setState(() {
                      _selected = index;
                      _status = '${destination.label}へ移動しました';
                    }),
                    child: Text(
                      destination.label,
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(_selected == 0 ? 'ホームの内容' : '検索の内容'),
      ],
    );
  }

  Widget _sideNavigationDemo() {
    const labels = ['ホーム', '分析', '設定'];
    return SizedBox(
      height: 165,
      child: Row(
        children: [
          SizedBox(
            width: 112,
            child: Material(
              color: const Color(0xFFF0F3F8),
              borderRadius: BorderRadius.circular(12),
              child: ListView.builder(
                padding: const EdgeInsets.all(6),
                itemCount: labels.length,
                itemBuilder: (_, index) => ListTile(
                  dense: true,
                  selected: _selected == index,
                  selectedTileColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(9),
                  ),
                  title: Text(
                    labels[index],
                    style: const TextStyle(fontSize: 12),
                  ),
                  onTap: () => setState(() {
                    _selected = index;
                    _status = '${labels[index]}へ移動しました';
                  }),
                ),
              ),
            ),
          ),
          Expanded(
            child: Center(
              child: Text(
                '${labels[_selected]}画面',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _navigationDrawerDemo() {
    return Stack(
      children: [
        Center(
          child: FilledButton.icon(
            onPressed: () => setState(() {
              _open = true;
              _status = 'ナビゲーションドロワーを開きました';
            }),
            icon: const Icon(Icons.menu_rounded),
            label: const Text('メニューを開く'),
          ),
        ),
        if (_open)
          Positioned.fill(
            child: Row(
              children: [
                Expanded(
                  flex: 4,
                  child: Material(
                    color: Colors.white,
                    elevation: 8,
                    borderRadius: BorderRadius.circular(12),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        for (final label in ['ホーム', '保存', '設定'])
                          ListTile(
                            dense: true,
                            title: Text(label),
                            onTap: () => setState(() {
                              _open = false;
                              _status = '$labelを選び、ドロワーを閉じました';
                            }),
                          ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Semantics(
                    button: true,
                    label: 'メニューを閉じる',
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => setState(() {
                        _open = false;
                        _status = '外側をタップして閉じました';
                      }),
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _bottomNavigationDemo() {
    return _phoneFrame(
      Column(
        children: [
          Expanded(
            child: Center(
              child: Text(
                ['ホーム', '検索', '保存'][_selected],
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ),
          NavigationBar(
            height: 64,
            selectedIndex: _selected,
            onDestinationSelected: (value) => setState(() {
              _selected = value;
              _status = '${['ホーム', '検索', '保存'][value]}へ切り替えました';
            }),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                label: 'ホーム',
              ),
              NavigationDestination(
                icon: Icon(Icons.search_rounded),
                label: '検索',
              ),
              NavigationDestination(
                icon: Icon(Icons.bookmark_border_rounded),
                label: '保存',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tabsDemo() {
    const tabs = ['概要', '活動', '設定'];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Wrap(
          spacing: 5,
          children: [
            for (var index = 0; index < tabs.length; index++)
              TextButton(
                onPressed: () => setState(() {
                  _selected = index;
                  _status = '${tabs[index]}タブへ切り替えました';
                }),
                style: TextButton.styleFrom(
                  backgroundColor: _selected == index
                      ? const Color(0xFFE8EDFF)
                      : null,
                  foregroundColor: _selected == index
                      ? AtlasColors.blue
                      : AtlasColors.muted,
                ),
                child: Text(tabs[index]),
              ),
          ],
        ),
        const Divider(),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text('${tabs[_selected]}のコンテンツ'),
        ),
      ],
    );
  }

  Widget _breadcrumbsDemo() {
    const parts = ['プロジェクト', 'UI Atlas', '教材'];
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        for (var index = 0; index < parts.length; index++) ...[
          TextButton(
            onPressed: () => _setStatus('${parts[index]}階層へ移動しました'),
            child: Text(parts[index]),
          ),
          if (index < parts.length - 1)
            const Icon(Icons.chevron_right_rounded, color: AtlasColors.muted),
        ],
      ],
    );
  }

  Widget _paginationDemo() {
    return _center(
      Wrap(
        spacing: 6,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          IconButton.outlined(
            onPressed: _selected == 0
                ? null
                : () => setState(() => _selected -= 1),
            tooltip: '前のページ',
            icon: const Icon(Icons.chevron_left_rounded),
          ),
          for (var index = 0; index < 4; index++)
            IconButton(
              onPressed: () => setState(() {
                _selected = index;
                _status = '${index + 1}ページ目を表示中です';
              }),
              style: IconButton.styleFrom(
                backgroundColor: _selected == index
                    ? AtlasColors.blue
                    : Colors.white,
                foregroundColor: _selected == index
                    ? Colors.white
                    : AtlasColors.ink,
                side: const BorderSide(color: AtlasColors.line),
              ),
              tooltip: '${index + 1}ページ',
              icon: Text('${index + 1}'),
            ),
          IconButton.outlined(
            onPressed: _selected == 3
                ? null
                : () => setState(() => _selected += 1),
            tooltip: '次のページ',
            icon: const Icon(Icons.chevron_right_rounded),
          ),
        ],
      ),
    );
  }

  Widget _stepDemo() {
    const labels = ['配送先', '支払い', '確認'];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            for (var index = 0; index < labels.length; index++) ...[
              Expanded(
                child: InkWell(
                  onTap: () => setState(() {
                    _selected = index;
                    _status = '${labels[index]}の工程を表示しました';
                  }),
                  borderRadius: BorderRadius.circular(10),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: index <= _selected
                              ? AtlasColors.blue
                              : const Color(0xFFE4E8EF),
                          foregroundColor: index <= _selected
                              ? Colors.white
                              : AtlasColors.muted,
                          child: Text('${index + 1}'),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          labels[index],
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (index < labels.length - 1)
                const SizedBox(width: 8, child: Divider()),
            ],
          ],
        ),
        const SizedBox(height: 10),
        FilledButton(
          onPressed: _selected == labels.length - 1
              ? null
              : () => setState(() {
                  _selected += 1;
                  _status = '${labels[_selected]}へ進みました';
                }),
          child: const Text('次へ'),
        ),
      ],
    );
  }

  Widget _inPageDemo() {
    const labels = ['概要', '仕様', '注意点'];
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 6,
          children: [
            for (var index = 0; index < labels.length; index++)
              ActionChip(
                label: Text(labels[index]),
                onPressed: () => setState(() {
                  _selected = index;
                  _status = '${labels[index]}見出しへ移動しました';
                }),
              ),
          ],
        ),
        const SizedBox(height: 18),
        Text(
          labels[_selected],
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 6),
        const Text(
          '同じページ内の該当セクションです。',
          style: TextStyle(color: AtlasColors.muted),
        ),
      ],
    );
  }

  Widget _backUpDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '階層レベル ${_count + 1}',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 14),
        Wrap(
          spacing: 8,
          children: [
            OutlinedButton.icon(
              onPressed: _count == 0
                  ? null
                  : () => setState(() {
                      _count -= 1;
                      _status = '一つ前の階層へ戻りました';
                    }),
              icon: const Icon(Icons.arrow_back_rounded),
              label: const Text('戻る'),
            ),
            FilledButton.icon(
              onPressed: () => setState(() {
                _count += 1;
                _status = '子の階層へ移動しました';
              }),
              iconAlignment: IconAlignment.end,
              icon: const Icon(Icons.arrow_forward_rounded),
              label: const Text('詳細へ'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _treeDemo({required bool navigation}) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ListTile(
          dense: true,
          leading: IconButton(
            onPressed: () => setState(() {
              _open = !_open;
              _status = _open
                  ? 'Design Systemを展開しました'
                  : 'Design Systemを折りたたみました';
            }),
            tooltip: _open ? '折りたたむ' : '展開する',
            icon: Icon(
              _open ? Icons.expand_more_rounded : Icons.chevron_right_rounded,
            ),
          ),
          title: const Text(
            'Design System',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          onTap: navigation ? () => _setStatus('Design Systemへ移動しました') : null,
        ),
        if (_open)
          Padding(
            padding: const EdgeInsets.only(left: 32),
            child: Column(
              children: [
                for (final item in ['Components', 'Tokens'])
                  ListTile(
                    dense: true,
                    leading: Icon(
                      navigation
                          ? Icons.folder_outlined
                          : Icons.account_tree_outlined,
                    ),
                    title: Text(item),
                    onTap: () => _setStatus('$itemを選択しました'),
                  ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _validationDemo() {
    final invalid = _text.isNotEmpty && !_text.contains('@');
    return TextField(
      keyboardType: TextInputType.emailAddress,
      onChanged: (value) => setState(() {
        final isInvalid = value.isNotEmpty && !value.contains('@');
        _text = value;
        _status = value.isEmpty
            ? '入力待ちです'
            : isInvalid
            ? 'メールアドレスの形式を確認してください'
            : '入力形式は正しいです';
      }),
      decoration: InputDecoration(
        labelText: 'メールアドレス',
        hintText: 'name@example.com',
        errorText: invalid ? '「@」を含む形式で入力してください' : null,
        suffixIcon: _text.contains('@')
            ? const Icon(Icons.check_circle_rounded, color: AtlasColors.success)
            : null,
      ),
    );
  }

  Widget _bannerDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!_enabled)
          MaterialBanner(
            padding: const EdgeInsets.all(12),
            backgroundColor: const Color(0xFFFFF4DF),
            leading: const Icon(
              Icons.warning_amber_rounded,
              color: AtlasColors.warning,
            ),
            content: const Text('メンテナンスは18:00からです。'),
            actions: [
              TextButton(
                onPressed: () => setState(() => _enabled = true),
                child: const Text('閉じる'),
              ),
            ],
          )
        else
          OutlinedButton(
            onPressed: () => setState(() => _enabled = false),
            child: const Text('バナーを再表示'),
          ),
      ],
    );
  }

  Widget _toastDemo(BuildContext context) {
    return _center(
      FilledButton(
        onPressed: () {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: const Text('アーカイブしました'),
                action: SnackBarAction(
                  label: '元に戻す',
                  onPressed: () => _setStatus('アーカイブを取り消しました'),
                ),
              ),
            );
          _setStatus('作業を止めず、一時通知で完了を伝えました');
        },
        child: const Text('アーカイブする'),
      ),
    );
  }

  Widget _spinnerDemo() {
    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_enabled)
            const CircularProgressIndicator(semanticsLabel: '読み込み中')
          else
            const Icon(
              Icons.cloud_done_rounded,
              color: AtlasColors.success,
              size: 44,
            ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () => setState(() {
              _enabled = !_enabled;
              _status = _enabled ? '読み込み中です' : '読み込みが完了しました';
            }),
            child: Text(_enabled ? '完了させる' : '読み込みを開始'),
          ),
        ],
      ),
    );
  }

  Widget _progressDemo() {
    final percent = (_value * 100).round();
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'アップロード',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
            Text('$percent%'),
          ],
        ),
        const SizedBox(height: 9),
        LinearProgressIndicator(
          value: _value,
          minHeight: 10,
          borderRadius: BorderRadius.circular(999),
        ),
        Slider(
          value: _value,
          onChanged: (value) => setState(() {
            _value = value;
            _status = '進捗は${(value * 100).round()}%です';
          }),
        ),
      ],
    );
  }

  Widget _skeletonDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!_enabled)
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E6ED),
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  children: [
                    for (final width in [1.0, 0.75, 0.45])
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: FractionallySizedBox(
                          widthFactor: width,
                          child: Container(
                            height: 10,
                            color: const Color(0xFFE2E6ED),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          )
        else
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(child: Text('UA')),
            title: Text(
              'UI Atlas',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            subtitle: Text('コンテンツを読み込みました'),
          ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: () => setState(() {
            _enabled = !_enabled;
            _status = _enabled ? '実データを表示しました' : '読み込み前の骨格を表示しました';
          }),
          child: Text(_enabled ? 'もう一度見る' : '読み込みを完了'),
        ),
      ],
    );
  }

  Widget _badgeDemo() {
    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Badge.count(
            count: _count,
            isLabelVisible: _count > 0,
            child: IconButton.filledTonal(
              onPressed: () => setState(() {
                _count = 0;
                _status = 'すべて既読にしました';
              }),
              tooltip: '受信トレイ',
              icon: const Icon(Icons.inbox_rounded),
            ),
          ),
          const SizedBox(height: 13),
          OutlinedButton(
            onPressed: () => setState(() {
              _count += 1;
              _status = '未読が$_count件あります';
            }),
            child: const Text('未読を追加'),
          ),
        ],
      ),
    );
  }

  Widget _emptyStateDemo() {
    return _center(
      _enabled
          ? ListTile(
              leading: const CircleAvatar(
                child: Icon(Icons.description_outlined),
              ),
              title: const Text('最初のドキュメント'),
              trailing: IconButton(
                onPressed: () => setState(() => _enabled = false),
                tooltip: '削除',
                icon: const Icon(Icons.delete_outline_rounded),
              ),
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.inbox_outlined,
                  color: AtlasColors.muted,
                  size: 43,
                ),
                const SizedBox(height: 8),
                const Text(
                  'まだ項目がありません',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => setState(() {
                    _enabled = true;
                    _status = '最初の項目を作成しました';
                  }),
                  child: const Text('最初の項目を作成'),
                ),
              ],
            ),
    );
  }

  Widget _saveStatusDemo() {
    const states = ['保存済み', '保存中…', 'オフライン', '競合を確認'];
    final colors = [
      AtlasColors.success,
      AtlasColors.blue,
      AtlasColors.warning,
      AtlasColors.danger,
    ];
    final icons = [
      Icons.cloud_done_rounded,
      Icons.sync_rounded,
      Icons.cloud_off_rounded,
      Icons.compare_arrows_rounded,
    ];
    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icons[_selected], color: colors[_selected], size: 42),
          const SizedBox(height: 9),
          Text(
            states[_selected],
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 14),
          OutlinedButton(
            onPressed: () => setState(() {
              _selected = (_selected + 1) % states.length;
              _status = '同期状態を「${states[_selected]}」にしました';
            }),
            child: const Text('次の状態'),
          ),
        ],
      ),
    );
  }

  Widget _errorRetryDemo() {
    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _enabled ? Icons.check_circle_rounded : Icons.error_outline_rounded,
            color: _enabled ? AtlasColors.success : AtlasColors.danger,
            size: 42,
          ),
          const SizedBox(height: 8),
          Text(
            _enabled ? 'データを取得しました' : 'この部分を読み込めませんでした',
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 13),
          OutlinedButton.icon(
            onPressed: () => setState(() {
              _enabled = !_enabled;
              _status = _enabled ? '再試行に成功しました' : '失敗状態を再現しました';
            }),
            icon: const Icon(Icons.refresh_rounded),
            label: Text(_enabled ? '失敗を再現' : 'もう一度試す'),
          ),
        ],
      ),
    );
  }

  Widget _tooltipDemo() {
    return _center(
      const Tooltip(
        message: 'お気に入りに保存',
        triggerMode: TooltipTriggerMode.tap,
        child: _DemoButtonFace(
          icon: Icons.bookmark_border_rounded,
          label: 'タップで説明を見る',
        ),
      ),
    );
  }

  Widget _popoverDemo() {
    return _center(
      MenuAnchor(
        builder: (context, controller, child) => FilledButton.icon(
          onPressed: () =>
              controller.isOpen ? controller.close() : controller.open(),
          icon: const Icon(Icons.tune_rounded),
          label: const Text('表示設定'),
        ),
        menuChildren: [
          CheckboxMenuButton(
            value: _enabled,
            onChanged: (value) => setState(() {
              _enabled = value ?? false;
              _status = _enabled ? '詳細情報を表示します' : '詳細情報を隠します';
            }),
            child: const Text('詳細情報を表示'),
          ),
          MenuItemButton(
            onPressed: () => _setStatus('表示設定をリセットしました'),
            child: const Text('リセット'),
          ),
        ],
      ),
    );
  }

  Widget _contextMenuDemo(BuildContext context) {
    void showMenu() {
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final item in ['返信', 'コピー', '削除'])
                ListTile(
                  leading: Icon(
                    item == '削除'
                        ? Icons.delete_outline_rounded
                        : Icons.chevron_right_rounded,
                  ),
                  title: Text(item),
                  onTap: () {
                    Navigator.pop(context);
                    _setStatus('「$item」を選びました');
                  },
                ),
            ],
          ),
        ),
      );
    }

    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onLongPress: showMenu,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF0F3F8),
                borderRadius: BorderRadius.circular(13),
              ),
              padding: const EdgeInsets.all(18),
              child: const Text(
                'このメッセージを長押し',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(onPressed: showMenu, child: const Text('操作メニューを開く（代替）')),
        ],
      ),
    );
  }

  Widget _modalDemo(BuildContext context) {
    return _center(
      FilledButton(
        onPressed: () async {
          final result = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('プロフィールを編集'),
              content: const TextField(
                decoration: InputDecoration(labelText: '表示名'),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('キャンセル'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('保存'),
                ),
              ],
            ),
          );
          _setStatus(result == true ? 'モーダル内の変更を保存しました' : '変更せず閉じました');
        },
        child: const Text('モーダルを開く'),
      ),
    );
  }

  Widget _alertDialogDemo(BuildContext context) {
    return _center(
      FilledButton.tonalIcon(
        onPressed: () async {
          final deleted = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              icon: const Icon(
                Icons.warning_amber_rounded,
                color: AtlasColors.danger,
              ),
              title: const Text('この項目を削除しますか？'),
              content: const Text('この操作は元に戻せません。対象を確認してください。'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('キャンセル'),
                ),
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: AtlasColors.danger,
                  ),
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('項目を削除'),
                ),
              ],
            ),
          );
          _setStatus(deleted == true ? '項目を削除しました' : '削除を取り消しました');
        },
        icon: const Icon(Icons.delete_outline_rounded),
        label: const Text('削除を試す'),
      ),
    );
  }

  Widget _bottomSheetDemo(BuildContext context) {
    return _center(
      FilledButton(
        onPressed: () async {
          final value = await showModalBottomSheet<String>(
            context: context,
            showDragHandle: true,
            useSafeArea: true,
            builder: (context) => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const ListTile(
                  title: Text(
                    '並べ替え',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                  subtitle: Text('現在の画面を残したまま選択'),
                ),
                for (final item in ['新しい順', '名前順', 'よく使う順'])
                  ListTile(
                    title: Text(item),
                    onTap: () => Navigator.pop(context, item),
                  ),
              ],
            ),
          );
          if (value != null) _setStatus('「$value」を選びました');
        },
        child: const Text('ボトムシートを開く'),
      ),
    );
  }

  Widget _sideSheetDemo(BuildContext context) {
    return _center(
      FilledButton(
        onPressed: () async {
          await showGeneralDialog<void>(
            context: context,
            barrierDismissible: true,
            barrierLabel: '詳細パネルを閉じる',
            barrierColor: Colors.black38,
            transitionDuration: const Duration(milliseconds: 220),
            pageBuilder: (context, animation, secondaryAnimation) => Align(
              alignment: Alignment.centerRight,
              child: SafeArea(
                child: Material(
                  color: Colors.white,
                  child: SizedBox(
                    width: math.min(
                      MediaQuery.sizeOf(context).width * 0.82,
                      360,
                    ),
                    height: double.infinity,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Expanded(
                                child: Text(
                                  'プロパティ',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed: () => Navigator.pop(context),
                                tooltip: '閉じる',
                                icon: const Icon(Icons.close_rounded),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),
                          const TextField(
                            decoration: InputDecoration(labelText: '項目名'),
                          ),
                          const SizedBox(height: 12),
                          const Text('元の作業領域を残しながら詳細を編集できます。'),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            transitionBuilder:
                (context, animation, secondaryAnimation, child) =>
                    SlideTransition(
                      position:
                          Tween(
                            begin: const Offset(1, 0),
                            end: Offset.zero,
                          ).animate(
                            CurvedAnimation(
                              parent: animation,
                              curve: Curves.easeOutCubic,
                            ),
                          ),
                      child: child,
                    ),
          );
          _setStatus('サイドシートを閉じました');
        },
        child: const Text('サイドシートを開く'),
      ),
    );
  }

  Widget _accordionDemo() {
    const titles = ['返品できますか？', '送料はいくらですか？', '支払い方法は？'];
    return ExpansionPanelList(
      expandedHeaderPadding: EdgeInsets.zero,
      expansionCallback: (index, expanded) => setState(() {
        _expanded[index] = !_expanded[index];
        _status = '${titles[index]}を${_expanded[index] ? '開きました' : '閉じました'}';
      }),
      children: [
        for (var index = 0; index < titles.length; index++)
          ExpansionPanel(
            isExpanded: _expanded[index],
            canTapOnHeader: true,
            headerBuilder: (_, _) => ListTile(
              title: Text(
                titles[index],
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
            body: const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text('詳しい回答がここに表示されます。'),
            ),
          ),
      ],
    );
  }

  Widget _disclosureDemo() {
    return const ExpansionTile(
      title: Text('高度な設定', style: TextStyle(fontWeight: FontWeight.w800)),
      subtitle: Text('単独の補足領域を開閉'),
      children: [
        Padding(padding: EdgeInsets.all(16), child: Text('キャッシュ、同期、デバッグの設定')),
      ],
    );
  }

  Widget _lightboxDemo(BuildContext context) {
    Widget artwork({double height = 125}) => Container(
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: const LinearGradient(
          colors: [Color(0xFF3D66F5), Color(0xFF8B5CF6), Color(0xFFD8FF56)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 43),
      ),
    );

    return InkWell(
      onTap: () => showDialog<void>(
        context: context,
        builder: (context) => Dialog.fullscreen(
          backgroundColor: const Color(0xEE0E1629),
          child: SafeArea(
            child: Stack(
              children: [
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: artwork(height: 330),
                  ),
                ),
                Positioned(
                  right: 10,
                  top: 10,
                  child: IconButton.filled(
                    onPressed: () => Navigator.pop(context),
                    tooltip: '画像を閉じる',
                    icon: const Icon(Icons.close_rounded),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      borderRadius: BorderRadius.circular(14),
      child: Stack(
        children: [
          artwork(),
          const Positioned(
            right: 9,
            bottom: 9,
            child: Icon(Icons.zoom_in_rounded, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _coachmarkDemo() {
    return Stack(
      alignment: Alignment.center,
      children: [
        FilledButton.tonal(
          onPressed: () => setState(() => _open = true),
          child: const Text('新しい分析'),
        ),
        if (_open)
          Positioned(
            top: 0,
            right: 0,
            left: 0,
            child: Card(
              color: AtlasColors.ink,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '新しい分析機能',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'ここから比較レポートを作れます。',
                      style: TextStyle(color: Color(0xFFC8D1E3)),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => setState(() => _open = false),
                        child: const Text('わかった'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _listDemo() {
    const labels = ['デザインレビュー', 'リリース準備', '利用者インタビュー'];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var index = 0; index < labels.length; index++)
          ListTile(
            selected: _selected == index,
            leading: CircleAvatar(child: Text('${index + 1}')),
            title: Text(labels[index]),
            subtitle: Text(index == 0 ? '10:30' : '明日'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => setState(() {
              _selected = index;
              _status = '${labels[index]}を選択しました';
            }),
          ),
      ],
    );
  }

  Widget _cardDemo() {
    const labels = ['東京', '京都'];
    return Row(
      children: [
        for (var index = 0; index < labels.length; index++)
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(right: index == 0 ? 8 : 0),
              child: InkWell(
                onTap: () => setState(() {
                  _selected = index;
                  _status = '${labels[index]}のカードを開きました';
                }),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  decoration: BoxDecoration(
                    color: _selected == index
                        ? const Color(0xFFE9EEFF)
                        : const Color(0xFFF4F6FA),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _selected == index
                          ? AtlasColors.blue
                          : AtlasColors.line,
                    ),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        height: 70,
                        decoration: BoxDecoration(
                          color: index == 0
                              ? const Color(0xFFB7D7FF)
                              : const Color(0xFFFFD5B0),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        labels[index],
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                      const Text(
                        'おすすめの場所',
                        style: TextStyle(
                          color: AtlasColors.muted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _tableDemo({required bool editable}) {
    final rows = [
      ['Basic', '¥980', '有効'],
      ['Pro', '¥1,980', '試用中'],
      ['Team', '¥4,980', '有効'],
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        sortColumnIndex: 0,
        sortAscending: !_secondary,
        columns: [
          DataColumn(
            label: const Text('プラン'),
            onSort: (_, ascending) => setState(() {
              _secondary = !_secondary;
              _status = 'プラン名で${_secondary ? '降順' : '昇順'}に並べました';
            }),
          ),
          const DataColumn(label: Text('料金'), numeric: true),
          const DataColumn(label: Text('状態')),
        ],
        rows: [
          for (var index = 0; index < rows.length; index++)
            DataRow(
              selected: _selected == index,
              onSelectChanged: (selected) => setState(() {
                _selected = index;
                _status = '${rows[index][0]}行を選択しました';
              }),
              cells: [
                DataCell(Text(rows[index][0])),
                DataCell(
                  editable
                      ? TextButton(
                          onPressed: () =>
                              _setStatus('${rows[index][0]}の料金セルを編集しました'),
                          child: Text(rows[index][1]),
                        )
                      : Text(rows[index][1]),
                ),
                DataCell(Text(rows[index][2])),
              ],
            ),
        ],
      ),
    );
  }

  Widget _metricDemo() {
    final amount = _enabled ? '¥284,000' : '¥1,248,000';
    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SegmentedButton<bool>(
            showSelectedIcon: false,
            segments: const [
              ButtonSegment(value: false, label: Text('月')),
              ButtonSegment(value: true, label: Text('週')),
            ],
            selected: {_enabled},
            onSelectionChanged: (value) => setState(() {
              _enabled = value.single;
              _status = _enabled ? '週次の指標を表示中です' : '月次の指標を表示中です';
            }),
          ),
          const SizedBox(height: 16),
          const Text('売上', style: TextStyle(color: AtlasColors.muted)),
          Text(
            amount,
            style: const TextStyle(fontSize: 31, fontWeight: FontWeight.w900),
          ),
          const Text(
            '前期比 +12.4%',
            style: TextStyle(
              color: AtlasColors.success,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _chartDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 130,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => setState(() {
              _selected = (_selected + 1) % 5;
              _status =
                  '${['月', '火', '水', '木', '金'][_selected]}曜日は${[35, 62, 48, 83, 67][_selected]}件です';
            }),
            child: CustomPaint(
              painter: _BarChartPainter(selected: _selected),
              size: Size.infinite,
            ),
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          'チャートをタップして値を比較',
          style: TextStyle(color: AtlasColors.muted, fontSize: 12),
        ),
      ],
    );
  }

  Widget _timelineDemo() {
    const events = ['プロジェクトを作成', 'レビューを依頼', '変更を公開'];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var index = 0; index < events.length; index++)
          InkWell(
            onTap: () => setState(() {
              _selected = index;
              _status = '${events[index]}の詳細を表示しました';
            }),
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 7),
              child: Row(
                children: [
                  Column(
                    children: [
                      CircleAvatar(
                        radius: 7,
                        backgroundColor: _selected == index
                            ? AtlasColors.blue
                            : const Color(0xFFC8D0DE),
                      ),
                      if (index < events.length - 1)
                        Container(
                          width: 2,
                          height: 28,
                          color: const Color(0xFFDCE2EC),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      events[index],
                      style: TextStyle(
                        fontWeight: _selected == index
                            ? FontWeight.w900
                            : FontWeight.w600,
                      ),
                    ),
                  ),
                  Text(
                    '${9 + index}:00',
                    style: const TextStyle(
                      color: AtlasColors.muted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _calendarDemo() {
    return SizedBox(
      height: 330,
      child: CalendarDatePicker(
        initialDate: _date,
        firstDate: DateTime(2026, 1),
        lastDate: DateTime(2027, 12, 31),
        onDateChanged: (value) => setState(() {
          _date = value;
          _status = '${value.month}月${value.day}日を選択しました';
        }),
      ),
    );
  }

  Widget _carouselDemo() {
    const colors = [Color(0xFF3D66F5), Color(0xFF7A5AF8), Color(0xFF0F8B6D)];
    const labels = ['基礎を学ぶ', '比較して選ぶ', '実際に試す'];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: Container(
            key: ValueKey(_selected),
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              color: colors[_selected],
              borderRadius: BorderRadius.circular(15),
            ),
            alignment: Alignment.center,
            child: Text(
              labels[_selected],
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              onPressed: () => setState(
                () =>
                    _selected = (_selected - 1 + labels.length) % labels.length,
              ),
              tooltip: '前へ',
              icon: const Icon(Icons.chevron_left_rounded),
            ),
            for (var index = 0; index < labels.length; index++)
              Container(
                width: _selected == index ? 20 : 7,
                height: 7,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: _selected == index
                      ? AtlasColors.blue
                      : const Color(0xFFCBD2DE),
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            IconButton(
              onPressed: () =>
                  setState(() => _selected = (_selected + 1) % labels.length),
              tooltip: '次へ',
              icon: const Icon(Icons.chevron_right_rounded),
            ),
          ],
        ),
      ],
    );
  }

  Widget _mapDemo() {
    return AspectRatio(
      aspectRatio: 1.7,
      child: LayoutBuilder(
        builder: (context, constraints) => GestureDetector(
          onTapDown: (details) => setState(() {
            _marker = Offset(
              details.localPosition.dx / constraints.maxWidth,
              details.localPosition.dy / constraints.maxHeight,
            );
            _status = '地図上の新しい場所を選択しました';
          }),
          child: CustomPaint(
            painter: _MapPainter(marker: _marker),
            child: Align(
              alignment: Alignment.bottomRight,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: IconButton.filledTonal(
                  onPressed: () => setState(() {
                    _marker = const Offset(0.5, 0.5);
                    _status = '現在地へ戻りました';
                  }),
                  tooltip: '現在地へ戻る',
                  icon: const Icon(Icons.my_location_rounded),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _kanbanDemo() {
    const columns = ['TO DO', 'DOING', 'DONE'];
    final largeText = MediaQuery.textScalerOf(context).scale(14) > 20;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            for (var index = 0; index < columns.length; index++)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: Container(
                    height: largeText ? 280 : 105,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F4F8),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    padding: const EdgeInsets.all(7),
                    child: Column(
                      children: [
                        Text(
                          columns[index],
                          style: const TextStyle(
                            color: AtlasColors.muted,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 7),
                        if (_selected == index)
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AtlasColors.line),
                            ),
                            padding: const EdgeInsets.all(7),
                            child: const Text(
                              'UIを実装',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        SegmentedButton<int>(
          showSelectedIcon: false,
          segments: [
            for (var index = 0; index < columns.length; index++)
              ButtonSegment(value: index, label: Text(columns[index])),
          ],
          selected: {_selected},
          onSelectionChanged: (value) => setState(() {
            _selected = value.single;
            _status = 'カードを${columns[_selected]}へ移動しました';
          }),
        ),
      ],
    );
  }

  Widget _tagDemo() {
    const tags = ['bug', 'design', 'priority: high'];
    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final tag in tags.take(_enabled ? 3 : 2))
                Chip(label: Text(tag)),
            ],
          ),
          const SizedBox(height: 13),
          OutlinedButton(
            onPressed: () => setState(() {
              _enabled = !_enabled;
              _status = _enabled ? '状態ラベルを追加しました' : '状態ラベルを外しました';
            }),
            child: Text(_enabled ? 'ラベルを外す' : 'ラベルを追加'),
          ),
        ],
      ),
    );
  }

  Widget _responsiveGridDemo() {
    final columns = _value < 0.34
        ? 1
        : _value < 0.67
        ? 2
        : 3;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 105,
          child: GridView.count(
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: columns,
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
            children: [
              for (var index = 0; index < columns * 2; index++)
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6ECF8),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  alignment: Alignment.center,
                  child: Text('${index + 1}'),
                ),
            ],
          ),
        ),
        Slider(
          value: _value,
          onChanged: (value) => setState(() {
            final nextColumns = value < 0.34
                ? 1
                : value < 0.67
                ? 2
                : 3;
            _value = value;
            _status = '画面幅に合わせて$nextColumns列へ再配置しました';
          }),
        ),
      ],
    );
  }

  Widget _appShellDemo() {
    return SizedBox(
      height: 192,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border.all(color: AtlasColors.line),
          borderRadius: BorderRadius.circular(13),
        ),
        child: Column(
          children: [
            Container(
              height: 38,
              color: AtlasColors.ink,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              alignment: Alignment.centerLeft,
              child: const Text(
                'PRODUCT',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            Expanded(
              child: Row(
                children: [
                  Container(
                    width: 58,
                    color: const Color(0xFFE8ECF3),
                    child: Column(
                      children: [
                        for (var index = 0; index < 3; index++)
                          IconButton(
                            onPressed: () => setState(() {
                              _selected = index;
                              _status =
                                  '${['ホーム', '検索', '設定'][index]}領域を表示しました';
                            }),
                            tooltip: ['ホーム', '検索', '設定'][index],
                            icon: Icon(
                              [
                                Icons.home_outlined,
                                Icons.search_rounded,
                                Icons.settings_outlined,
                              ][index],
                            ),
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Center(
                      child: Text('${['ホーム', '検索', '設定'][_selected]}の主領域'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _masterDetailDemo() {
    const items = ['佐藤さん', '鈴木さん', '高橋さん'];
    final largeText = MediaQuery.textScalerOf(context).scale(14) > 20;
    return SizedBox(
      height: largeText ? 250 : 170,
      child: Row(
        children: [
          SizedBox(
            width: 105,
            child: ListView.builder(
              itemCount: items.length,
              itemBuilder: (_, index) => ListTile(
                dense: true,
                selected: _selected == index,
                title: Text(items[index], style: const TextStyle(fontSize: 12)),
                onTap: () => setState(() {
                  _selected = index;
                  _status = '${items[index]}の詳細を表示しました';
                }),
              ),
            ),
          ),
          const VerticalDivider(width: 1),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircleAvatar(child: Text(items[_selected].substring(0, 1))),
                  const SizedBox(height: 9),
                  Text(
                    items[_selected],
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const Text(
                    'プロフィール詳細',
                    style: TextStyle(color: AtlasColors.muted, fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _splitViewDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 125,
          child: Row(
            children: [
              Expanded(
                flex: math.max(1, (_value * 10).round()).toInt(),
                child: Container(
                  color: const Color(0xFFE7ECF8),
                  alignment: Alignment.center,
                  child: const Text('コード'),
                ),
              ),
              Container(width: 5, color: AtlasColors.blue),
              Expanded(
                flex: math.max(1, ((1 - _value) * 10).round()).toInt(),
                child: Container(
                  color: const Color(0xFFF3F5F9),
                  alignment: Alignment.center,
                  child: const Text('プレビュー'),
                ),
              ),
            ],
          ),
        ),
        Slider(
          value: _value,
          min: 0.15,
          max: 0.85,
          onChanged: (value) => setState(() {
            _value = value;
            _status = '左右の領域幅を変更しました';
          }),
        ),
      ],
    );
  }

  Widget _scrollDemo({required bool sticky}) {
    return SizedBox(
      height: 180,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border.all(color: AtlasColors.line),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            if (sticky)
              Container(
                width: double.infinity,
                color: const Color(0xFFE8EDFF),
                padding: const EdgeInsets.all(11),
                child: const Text(
                  '固定された見出し',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              ),
            Expanded(
              child: Scrollbar(
                controller: _innerScrollController,
                thumbVisibility: true,
                child: ListView.builder(
                  controller: _innerScrollController,
                  itemCount: 12,
                  itemBuilder: (_, index) => ListTile(
                    dense: true,
                    title: Text('項目 ${index + 1}'),
                    subtitle: Text(sticky ? '見出しは上に残ります' : 'この領域だけをスクロール'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _masonryDemo() {
    final heights = _enabled ? [72.0, 105.0, 58.0] : [105.0, 58.0, 82.0];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var index = 0; index < heights.length; index++)
              Expanded(
                child: Container(
                  height: heights[index],
                  margin: EdgeInsets.only(
                    right: index == heights.length - 1 ? 0 : 7,
                  ),
                  decoration: BoxDecoration(
                    color: [
                      const Color(0xFFBFD1FF),
                      const Color(0xFFFFD7B0),
                      const Color(0xFFBEE9D8),
                    ][index],
                    borderRadius: BorderRadius.circular(11),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: () => setState(() {
            _enabled = !_enabled;
            _status = '異なる高さのカードを再配置しました';
          }),
          child: const Text('並びを変える'),
        ),
      ],
    );
  }

  Widget _safeAreaDemo() {
    return _phoneFrame(
      Stack(
        children: [
          Positioned.fill(
            child: Container(
              color: _enabled ? const Color(0xFFDDE6FF) : AtlasColors.blue,
            ),
          ),
          Positioned(
            top: 0,
            left: 70,
            right: 70,
            child: Container(
              height: 18,
              decoration: const BoxDecoration(
                color: AtlasColors.ink,
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(11),
                ),
              ),
            ),
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 200),
            top: _enabled ? 27 : 3,
            left: 12,
            right: 12,
            child: FilledButton.tonal(
              onPressed: () => setState(() {
                _enabled = !_enabled;
                _status = _enabled ? 'セーフエリア内へ移動しました' : '危険な配置を再現しました';
              }),
              child: Text(_enabled ? '安全な位置' : 'ノッチに重なっています'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _thumbReachDemo() {
    return _phoneFrame(
      Stack(
        children: [
          Positioned(
            top: 5,
            left: 10,
            right: 10,
            child: OutlinedButton(
              onPressed: () => _setStatus('上部の操作は片手では届きにくい位置です'),
              child: const Text('低頻度の設定'),
            ),
          ),
          Positioned(
            bottom: 8,
            left: 10,
            right: 10,
            child: FilledButton.icon(
              onPressed: () => _setStatus('親指で届きやすい主要操作です'),
              icon: const Icon(Icons.add_rounded),
              label: const Text('新しく作成'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _keyboardAvoidanceDemo() {
    return _phoneFrame(
      Column(
        children: [
          const Expanded(
            child: Center(
              child: Text('会話履歴', style: TextStyle(color: AtlasColors.muted)),
            ),
          ),
          TextField(
            onChanged: (value) => _text = value,
            onSubmitted: (value) => _setStatus('「$value」を送信しました'),
            decoration: InputDecoration(
              hintText: 'メッセージ',
              isDense: true,
              suffixIcon: IconButton(
                onPressed: () => _setStatus('「$_text」を送信しました'),
                tooltip: '送信',
                icon: const Icon(Icons.send_rounded),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _permissionDemo(BuildContext context) {
    return _center(
      FilledButton.icon(
        onPressed: () async {
          final allowed = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              icon: const Icon(
                Icons.location_on_outlined,
                color: AtlasColors.blue,
              ),
              title: const Text('現在地を使いますか？'),
              content: const Text('近くの店舗を表示するためにだけ位置情報を使用します。'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('今はしない'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('次へ'),
                ),
              ],
            ),
          );
          _setStatus(allowed == true ? '用途説明の後にOS権限へ進みます' : '拒否後も設定から変更できます');
        },
        icon: const Icon(Icons.location_on_outlined),
        label: const Text('近くの店舗を見る'),
      ),
    );
  }

  Widget _shareSheetDemo(BuildContext context) {
    return _center(
      FilledButton.icon(
        onPressed: () async {
          final value = await showModalBottomSheet<String>(
            context: context,
            showDragHandle: true,
            useSafeArea: true,
            builder: (context) => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const ListTile(
                  title: Text(
                    '“UI Atlas”を共有',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
                Wrap(
                  spacing: 18,
                  children: [
                    for (final item in ['コピー', 'メッセージ', 'メール'])
                      ActionChip(
                        label: Text(item),
                        avatar: CircleAvatar(child: Text(item.substring(0, 1))),
                        onPressed: () => Navigator.pop(context, item),
                      ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
          if (value != null) _setStatus('共有先「$value」を選びました');
        },
        icon: const Icon(Icons.ios_share_rounded),
        label: const Text('共有…'),
      ),
    );
  }

  Widget _biometricDemo(BuildContext context) {
    return _center(
      FilledButton.icon(
        onPressed: () async {
          final value = await showDialog<bool>(
            context: context,
            barrierDismissible: false,
            builder: (context) => AlertDialog(
              icon: const Icon(
                Icons.face_rounded,
                size: 46,
                color: AtlasColors.blue,
              ),
              title: const Text('Face IDで認証'),
              content: const Text('支払い情報を表示するため本人確認します。'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('端末コードを使う'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('認証を試す'),
                ),
              ],
            ),
          );
          _setStatus(value == true ? '生体認証に成功した状態です' : '端末コードへ切り替えました');
        },
        icon: const Icon(Icons.lock_open_rounded),
        label: const Text('ロックを解除'),
      ),
    );
  }

  Widget _hapticsDemo() {
    return _center(
      Wrap(
        spacing: 9,
        children: [
          OutlinedButton(
            onPressed: () {
              HapticFeedback.selectionClick();
              _setStatus('選択の軽い触覚を再生しました');
            },
            child: const Text('選択'),
          ),
          FilledButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              _setStatus('完了の触覚を再生しました');
            },
            child: const Text('完了'),
          ),
        ],
      ),
    );
  }

  Widget _notificationDemo() {
    return _center(
      _enabled
          ? InkWell(
              onTap: () => setState(() {
                _selected = 1;
                _status = '通知から該当メッセージへ直接移動しました';
              }),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F3F8),
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.all(15),
                child: const Row(
                  children: [
                    CircleAvatar(
                      child: Icon(Icons.chat_bubble_outline_rounded),
                    ),
                    SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'レビューが届きました',
                            style: TextStyle(fontWeight: FontWeight.w900),
                          ),
                          Text('タップしてコメントを開く'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )
          : FilledButton.icon(
              onPressed: () => setState(() {
                _enabled = true;
                _status = '通知を表示しました';
              }),
              icon: const Icon(Icons.notifications_active_outlined),
              label: const Text('通知を受け取る'),
            ),
    );
  }

  Widget _offlineDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SwitchListTile.adaptive(
          value: _enabled,
          onChanged: (value) => setState(() {
            _enabled = value;
            _status = value ? 'オフラインになりました。編集は端末に保持します' : '再接続し、変更を同期しました';
          }),
          title: const Text('機内モードを再現'),
          subtitle: Text(_enabled ? '変更1件を端末に保存中' : 'すべて同期済み'),
          secondary: Icon(
            _enabled ? Icons.cloud_off_rounded : Icons.cloud_done_rounded,
            color: _enabled ? AtlasColors.warning : AtlasColors.success,
          ),
          contentPadding: EdgeInsets.zero,
        ),
        TextField(
          onChanged: (_) =>
              _setStatus(_enabled ? '変更を端末へ保存しました' : '変更をクラウドへ同期しました'),
          decoration: const InputDecoration(labelText: 'オフラインでも編集できます'),
        ),
      ],
    );
  }

  Widget _tapDemo() {
    return _center(
      InkWell(
        onTap: () => setState(() {
          _count += 1;
          _status = '$_count回タップしました';
        }),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: 150,
          height: 110,
          decoration: BoxDecoration(
            color: const Color(0xFFE7EDFF),
            borderRadius: BorderRadius.circular(20),
          ),
          alignment: Alignment.center,
          child: Text(
            'タップ $_count',
            style: const TextStyle(
              color: AtlasColors.blue,
              fontSize: 19,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ),
    );
  }

  Widget _doubleTapDemo() {
    void like() => setState(() {
      _enabled = !_enabled;
      _status = _enabled ? 'いいねしました' : 'いいねを外しました';
    });
    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onDoubleTap: like,
            child: Container(
              width: 170,
              height: 100,
              decoration: BoxDecoration(
                color: const Color(0xFFE7EDFF),
                borderRadius: BorderRadius.circular(16),
              ),
              alignment: Alignment.center,
              child: Icon(
                _enabled
                    ? Icons.favorite_rounded
                    : Icons.favorite_border_rounded,
                color: _enabled ? Colors.redAccent : AtlasColors.blue,
                size: 42,
              ),
            ),
          ),
          TextButton.icon(
            onPressed: like,
            icon: Icon(
              _enabled ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            ),
            label: const Text('ボタンでも切り替える'),
          ),
        ],
      ),
    );
  }

  Widget _longPressDemo(BuildContext context) {
    void openMenu() {
      setState(() => _open = true);
      _setStatus('長押しメニューを開きました');
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder: (context) => SafeArea(
          child: ListTile(
            leading: const Icon(Icons.edit_outlined),
            title: const Text('名前を変更'),
            onTap: () => Navigator.pop(context),
          ),
        ),
      );
    }

    return _center(
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onLongPress: openMenu,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF0F3F8),
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.all(20),
              child: const Text(
                '長押しして追加操作',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
          TextButton(onPressed: openMenu, child: const Text('メニューを開く（代替）')),
        ],
      ),
    );
  }

  Widget _swipeDemo({required bool action}) {
    if (_items.isEmpty) {
      return _center(
        OutlinedButton(
          onPressed: () => setState(() {
            _items.addAll(['企画', 'デザイン', '実装']);
            _status = '項目を元に戻しました';
          }),
          child: const Text('項目を元に戻す'),
        ),
      );
    }
    final item = _items.first;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Dismissible(
          key: ValueKey('$item-${_items.length}'),
          direction: DismissDirection.horizontal,
          background: Container(
            color: AtlasColors.success,
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.all(18),
            child: const Icon(Icons.archive_rounded, color: Colors.white),
          ),
          secondaryBackground: Container(
            color: AtlasColors.danger,
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.all(18),
            child: const Icon(Icons.close_rounded, color: Colors.white),
          ),
          onDismissed: (direction) => setState(() {
            _items.removeAt(0);
            _status = action
                ? '$itemを${direction == DismissDirection.startToEnd ? 'アーカイブ' : '削除'}しました'
                : '$itemを閉じました';
          }),
          child: ListTile(
            tileColor: const Color(0xFFF0F3F8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            leading: const Icon(Icons.drag_handle_rounded),
            title: Text(item),
            subtitle: Text(action ? '左右にスワイプ' : 'スワイプして閉じる'),
          ),
        ),
        const SizedBox(height: 10),
        TextButton(
          onPressed: () => setState(() {
            _items.removeAt(0);
            _status = '$itemをボタンで処理しました';
          }),
          child: Text(action ? 'アーカイブ（代替）' : '閉じる（代替）'),
        ),
      ],
    );
  }

  Widget _edgeSwipeDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRect(
          child: GestureDetector(
            onHorizontalDragUpdate: (details) => setState(
              () => _dragX = math.max(
                0,
                math.min(130, _dragX + details.delta.dx),
              ),
            ),
            onHorizontalDragEnd: (_) => setState(() {
              final completed = _dragX > 80;
              _dragX = 0;
              _status = completed ? '戻る操作を完了しました' : '戻る操作をキャンセルしました';
            }),
            child: Transform.translate(
              offset: Offset(_dragX, 0),
              child: Container(
                height: 100,
                decoration: BoxDecoration(
                  color: const Color(0xFFE7EDFF),
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: const Text(
                  '左端から右へスワイプ',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ),
        ),
        TextButton.icon(
          onPressed: () => _setStatus('戻るボタンで同じ結果へ移動しました'),
          icon: const Icon(Icons.arrow_back_rounded),
          label: const Text('戻る（代替）'),
        ),
      ],
    );
  }

  Widget _dragDropDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Expanded(
              child: LongPressDraggable<String>(
                data: 'card',
                feedback: const Material(child: Chip(label: Text('カード'))),
                childWhenDragging: const Opacity(
                  opacity: 0.35,
                  child: _MoveCard(),
                ),
                child: const _MoveCard(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DragTarget<String>(
                onAcceptWithDetails: (_) => setState(() {
                  _enabled = true;
                  _status = 'カードを完了へ移動しました';
                }),
                builder: (_, candidate, rejected) => Container(
                  height: 90,
                  decoration: BoxDecoration(
                    color: candidate.isNotEmpty
                        ? const Color(0xFFE4F7EF)
                        : const Color(0xFFF0F3F8),
                    borderRadius: BorderRadius.circular(13),
                    border: Border.all(
                      color: candidate.isNotEmpty
                          ? AtlasColors.success
                          : AtlasColors.line,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _enabled ? '✓ 完了' : 'ここへドロップ',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        TextButton(
          onPressed: () => setState(() {
            _enabled = true;
            _status = '移動メニューで完了へ移しました';
          }),
          child: const Text('「完了」へ移動（代替）'),
        ),
      ],
    );
  }

  Widget _reorderDemo() {
    void move(int from, int to) {
      if (to < 0 || to >= _items.length) return;
      setState(() {
        final item = _items.removeAt(from);
        _items.insert(to, item);
        _status = '$itemを${to + 1}番目へ移動しました';
      });
    }

    return SizedBox(
      height: 180,
      child: ReorderableListView.builder(
        buildDefaultDragHandles: false,
        itemCount: _items.length,
        onReorderItem: move,
        itemBuilder: (_, index) {
          final item = _items[index];
          return ListTile(
            key: ValueKey(item),
            dense: true,
            leading: ReorderableDragStartListener(
              index: index,
              child: const Icon(Icons.drag_handle_rounded),
            ),
            title: Text(item),
            trailing: Wrap(
              spacing: 0,
              children: [
                IconButton(
                  onPressed: index == 0 ? null : () => move(index, index - 1),
                  tooltip: '上へ',
                  icon: const Icon(Icons.arrow_upward_rounded, size: 18),
                ),
                IconButton(
                  onPressed: index == _items.length - 1
                      ? null
                      : () => move(index, index + 1),
                  tooltip: '下へ',
                  icon: const Icon(Icons.arrow_downward_rounded, size: 18),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _interactiveViewerDemo({required bool allowScale}) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 135,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(13),
            child: InteractiveViewer(
              transformationController: _transformationController,
              minScale: allowScale ? 0.7 : 1,
              maxScale: allowScale ? 3 : 1,
              panEnabled: true,
              scaleEnabled: allowScale,
              onInteractionEnd: (_) =>
                  _setStatus(allowScale ? '拡大・移動しました' : 'キャンバスを移動しました'),
              child: SizedBox(
                width: 430,
                height: 230,
                child: CustomPaint(painter: _CanvasPainter()),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 7,
          children: [
            if (allowScale)
              OutlinedButton(
                onPressed: () {
                  _transformationController.value = Matrix4.identity()
                    ..scaleByDouble(1.4, 1.4, 1.0, 1.0);
                  _setStatus('ボタンで拡大しました');
                },
                child: const Text('＋ 拡大'),
              ),
            OutlinedButton(
              onPressed: () {
                _transformationController.value = Matrix4.identity();
                _setStatus('表示位置をリセットしました');
              },
              child: const Text('リセット'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _pullRefreshDemo() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 150,
          child: RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _count += 1;
                _status = '一覧を更新しました（$_count回）';
              });
            },
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: 4,
              itemBuilder: (_, index) => ListTile(
                dense: true,
                leading: const Icon(Icons.mail_outline_rounded),
                title: Text('メッセージ ${index + 1}'),
                subtitle: Text(_count == 0 ? '一覧を下へ引いて更新' : '更新 $_count'),
              ),
            ),
          ),
        ),
        TextButton.icon(
          onPressed: () => setState(() {
            _count += 1;
            _status = '更新ボタンで一覧を更新しました';
          }),
          icon: const Icon(Icons.refresh_rounded),
          label: const Text('更新（代替）'),
        ),
      ],
    );
  }

  Widget _scrubDemo() {
    final seconds = (_value * 240).round();
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Text(
              '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}',
            ),
            const Expanded(child: SizedBox()),
            const Text('4:00'),
          ],
        ),
        Slider(
          value: _value,
          onChanged: (value) => setState(() {
            _value = value;
            _status = '${(value * 240).round()}秒へ移動しました';
          }),
        ),
        Wrap(
          spacing: 8,
          children: [
            IconButton.outlined(
              onPressed: () =>
                  setState(() => _value = math.max(0, _value - 10 / 240)),
              tooltip: '10秒戻る',
              icon: const Icon(Icons.replay_10_rounded),
            ),
            IconButton.filled(
              onPressed: () => setState(() => _enabled = !_enabled),
              tooltip: _enabled ? '一時停止' : '再生',
              icon: Icon(
                _enabled ? Icons.pause_rounded : Icons.play_arrow_rounded,
              ),
            ),
            IconButton.outlined(
              onPressed: () =>
                  setState(() => _value = math.min(1, _value + 10 / 240)),
              tooltip: '10秒進む',
              icon: const Icon(Icons.forward_10_rounded),
            ),
          ],
        ),
      ],
    );
  }
}

class _DemoButtonFace extends StatelessWidget {
  const _DemoButtonFace({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFE8EDFF),
        borderRadius: BorderRadius.circular(13),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 17, vertical: 13),
      child: Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 9,
        runSpacing: 5,
        children: [
          Icon(icon, color: AtlasColors.blue),
          Text(
            label,
            style: const TextStyle(
              color: AtlasColors.blue,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _FaintRows extends StatelessWidget {
  const _FaintRows();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(9),
      itemCount: 4,
      separatorBuilder: (_, _) => const SizedBox(height: 7),
      itemBuilder: (_, index) => Container(
        height: 30,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}

class _MoveCard extends StatelessWidget {
  const _MoveCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 90,
      decoration: BoxDecoration(
        color: const Color(0xFFE7EDFF),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: AtlasColors.blue),
      ),
      alignment: Alignment.center,
      child: const Text(
        '長押しして移動',
        textAlign: TextAlign.center,
        style: TextStyle(color: AtlasColors.blue, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _BarChartPainter extends CustomPainter {
  _BarChartPainter({required this.selected});

  final int selected;

  @override
  void paint(Canvas canvas, Size size) {
    const values = [0.35, 0.62, 0.48, 0.83, 0.67];
    final gap = size.width / values.length;
    final barWidth = math.min(34.0, gap * 0.55);
    final basePaint = Paint()..color = const Color(0xFFDCE3EF);
    final selectedPaint = Paint()..color = AtlasColors.blue;
    for (var index = 0; index < values.length; index++) {
      final height = size.height * values[index];
      final left = gap * index + (gap - barWidth) / 2;
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(left, size.height - height, barWidth, height),
        const Radius.circular(7),
      );
      canvas.drawRRect(rect, index == selected ? selectedPaint : basePaint);
    }
  }

  @override
  bool shouldRepaint(_BarChartPainter oldDelegate) =>
      oldDelegate.selected != selected;
}

class _MapPainter extends CustomPainter {
  _MapPainter({required this.marker});

  final Offset marker;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFFE8F0E8),
    );
    final road = Paint()
      ..color = Colors.white
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(0, size.height * 0.65),
      Offset(size.width, size.height * 0.3),
      road,
    );
    canvas.drawLine(
      Offset(size.width * 0.35, 0),
      Offset(size.width * 0.6, size.height),
      road,
    );
    final point = Offset(marker.dx * size.width, marker.dy * size.height);
    canvas.drawCircle(point, 12, Paint()..color = AtlasColors.blue);
    canvas.drawCircle(point, 5, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(_MapPainter oldDelegate) => oldDelegate.marker != marker;
}

class _CanvasPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFFE9EEF8),
    );
    final grid = Paint()
      ..color = const Color(0xFFCBD5E7)
      ..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 24) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }
    for (double y = 0; y < size.height; y += 24) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: size.center(Offset.zero),
          width: 130,
          height: 78,
        ),
        const Radius.circular(16),
      ),
      Paint()..color = AtlasColors.blue,
    );
    final paragraph =
        (ui.ParagraphBuilder(ui.ParagraphStyle(textAlign: TextAlign.center))
              ..pushStyle(
                ui.TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              )
              ..addText('UI Canvas'))
            .build();
    paragraph.layout(const ui.ParagraphConstraints(width: 130));
    canvas.drawParagraph(
      paragraph,
      Offset(size.width / 2 - 65, size.height / 2 - paragraph.height / 2),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
