import 'dart:async';

import 'package:flutter/foundation.dart';

import 'app_preferences.dart';

final class AppController extends ChangeNotifier {
  AppController({
    required AppPreferences preferences,
    required Set<String> validPatternIds,
    // Keep the public constructor label descriptive while storing it privately.
    // ignore: prefer_initializing_formals
  }) : _preferences = preferences,
       _validPatternIds = {...validPatternIds};

  final AppPreferences _preferences;
  final Set<String> _validPatternIds;
  Set<String> _completed = <String>{};
  Set<String> _favorites = <String>{};
  Future<void> _writeQueue = Future<void>.value();
  bool _isReady = false;
  bool _isSaving = false;
  String? _storageError;

  bool get isReady => _isReady;
  bool get isSaving => _isSaving;
  String? get storageError => _storageError;
  Set<String> get completed => Set.unmodifiable(_completed);
  Set<String> get favorites => Set.unmodifiable(_favorites);
  int get completedCount => _completed.length;
  int get favoriteCount => _favorites.length;

  bool isCompleted(String id) => _completed.contains(id);
  bool isFavorite(String id) => _favorites.contains(id);

  Future<void> initialize() async {
    if (_isReady) return;
    try {
      final values = await Future.wait([
        _preferences.readCompleted(),
        _preferences.readFavorites(),
      ]);
      _completed = values[0].where(_validPatternIds.contains).toSet();
      _favorites = values[1].where(_validPatternIds.contains).toSet();
      _storageError = null;
    } on Object {
      _completed = <String>{};
      _favorites = <String>{};
      _storageError = '保存データを読み込めませんでした。このセッションでは引き続き利用できます。';
    } finally {
      _isReady = true;
      notifyListeners();
    }
  }

  Future<void> toggleCompleted(String id) async {
    if (!_validPatternIds.contains(id)) return;
    final next = {..._completed};
    if (!next.add(id)) next.remove(id);
    _completed = next;
    notifyListeners();
    await _queueWrite(() => _preferences.writeCompleted(next));
  }

  Future<void> markCompleted(String id) async {
    if (!_validPatternIds.contains(id) || _completed.contains(id)) return;
    final next = {..._completed, id};
    _completed = next;
    notifyListeners();
    await _queueWrite(() => _preferences.writeCompleted(next));
  }

  Future<void> toggleFavorite(String id) async {
    if (!_validPatternIds.contains(id)) return;
    final next = {..._favorites};
    if (!next.add(id)) next.remove(id);
    _favorites = next;
    notifyListeners();
    await _queueWrite(() => _preferences.writeFavorites(next));
  }

  void clearStorageError() {
    if (_storageError == null) return;
    _storageError = null;
    notifyListeners();
  }

  Future<void> _queueWrite(Future<void> Function() operation) {
    final completer = Completer<void>();
    _writeQueue = _writeQueue.then((_) async {
      _isSaving = true;
      notifyListeners();
      try {
        await operation();
        _storageError = null;
        completer.complete();
      } on Object {
        _storageError = '端末に保存できませんでした。もう一度操作してください。';
        completer.complete();
      } finally {
        _isSaving = false;
        notifyListeners();
      }
    });
    return completer.future;
  }
}
