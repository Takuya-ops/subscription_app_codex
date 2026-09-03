import 'package:shared_preferences/shared_preferences.dart';

abstract interface class AppPreferences {
  Future<Set<String>> readCompleted();

  Future<Set<String>> readFavorites();

  Future<void> writeCompleted(Set<String> ids);

  Future<void> writeFavorites(Set<String> ids);
}

final class SharedPreferencesAppPreferences implements AppPreferences {
  SharedPreferencesAppPreferences(this._preferences);

  static const _completedKey = 'ui_atlas.completed.v1';
  static const _favoritesKey = 'ui_atlas.favorites.v1';

  final SharedPreferences _preferences;

  static Future<SharedPreferencesAppPreferences> create() async {
    final preferences = await SharedPreferences.getInstance();
    return SharedPreferencesAppPreferences(preferences);
  }

  @override
  Future<Set<String>> readCompleted() async =>
      (_preferences.getStringList(_completedKey) ?? const <String>[]).toSet();

  @override
  Future<Set<String>> readFavorites() async =>
      (_preferences.getStringList(_favoritesKey) ?? const <String>[]).toSet();

  @override
  Future<void> writeCompleted(Set<String> ids) => _write(_completedKey, ids);

  @override
  Future<void> writeFavorites(Set<String> ids) => _write(_favoritesKey, ids);

  Future<void> _write(String key, Set<String> ids) async {
    final sorted = ids.toList()..sort();
    final saved = await _preferences.setStringList(key, sorted);
    if (!saved) throw StateError('端末への保存に失敗しました。');
  }
}

final class MemoryAppPreferences implements AppPreferences {
  MemoryAppPreferences({Set<String>? completed, Set<String>? favorites})
    : _completed = {...?completed},
      _favorites = {...?favorites};

  Set<String> _completed;
  Set<String> _favorites;

  @override
  Future<Set<String>> readCompleted() async => {..._completed};

  @override
  Future<Set<String>> readFavorites() async => {..._favorites};

  @override
  Future<void> writeCompleted(Set<String> ids) async {
    _completed = {...ids};
  }

  @override
  Future<void> writeFavorites(Set<String> ids) async {
    _favorites = {...ids};
  }
}
