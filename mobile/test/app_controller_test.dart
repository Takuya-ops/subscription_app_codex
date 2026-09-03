import 'package:flutter_test/flutter_test.dart';
import 'package:ui_atlas/src/state/app_controller.dart';
import 'package:ui_atlas/src/state/app_preferences.dart';

void main() {
  const validPatternIds = <String>{'button', 'switch', 'modal'};

  group('AppController', () {
    test('初期化で保存値を読み込み、未知IDを除外する', () async {
      final preferences = _RecordingAppPreferences(
        completed: const {'button', 'unknown-completed'},
        favorites: const {'switch', 'unknown-favorite'},
      );
      final controller = AppController(
        preferences: preferences,
        validPatternIds: validPatternIds,
      );
      addTearDown(controller.dispose);

      expect(controller.isReady, isFalse);
      expect(controller.completed, isEmpty);
      expect(controller.favorites, isEmpty);

      await controller.initialize();

      expect(controller.isReady, isTrue);
      expect(controller.storageError, isNull);
      expect(controller.completed, const {'button'});
      expect(controller.favorites, const {'switch'});
      expect(preferences.readCompletedCalls, 1);
      expect(preferences.readFavoritesCalls, 1);

      await controller.initialize();

      expect(preferences.readCompletedCalls, 1);
      expect(preferences.readFavoritesCalls, 1);
    });

    test('読込失敗後も利用可能な空状態として初期化する', () async {
      final preferences = _RecordingAppPreferences(failReads: true);
      final controller = AppController(
        preferences: preferences,
        validPatternIds: validPatternIds,
      );
      addTearDown(controller.dispose);

      await controller.initialize();

      expect(controller.isReady, isTrue);
      expect(controller.completed, isEmpty);
      expect(controller.favorites, isEmpty);
      expect(controller.storageError, isNotNull);
    });

    test('進捗とお気に入りを独立して更新・保存する', () async {
      final preferences = _RecordingAppPreferences(
        completed: const {'button'},
        favorites: const {'switch'},
      );
      final controller = AppController(
        preferences: preferences,
        validPatternIds: validPatternIds,
      );
      addTearDown(controller.dispose);
      await controller.initialize();

      await controller.markCompleted('switch');

      expect(controller.completed, const {'button', 'switch'});
      expect(controller.favorites, const {'switch'});
      expect(preferences.completedWrites, [
        const {'button', 'switch'},
      ]);
      expect(preferences.favoriteWrites, isEmpty);

      await controller.toggleFavorite('button');

      expect(controller.completed, const {'button', 'switch'});
      expect(controller.favorites, const {'button', 'switch'});
      expect(preferences.completedWrites, [
        const {'button', 'switch'},
      ]);
      expect(preferences.favoriteWrites, [
        const {'button', 'switch'},
      ]);
    });

    test('学習済み追加は冪等で、未知IDの更新は無視する', () async {
      final preferences = _RecordingAppPreferences();
      final controller = AppController(
        preferences: preferences,
        validPatternIds: validPatternIds,
      );
      addTearDown(controller.dispose);
      await controller.initialize();

      await controller.markCompleted('modal');
      await controller.markCompleted('modal');
      await controller.markCompleted('unknown');
      await controller.toggleCompleted('unknown');
      await controller.toggleFavorite('unknown');

      expect(controller.completed, const {'modal'});
      expect(controller.favorites, isEmpty);
      expect(preferences.completedWrites, [
        const {'modal'},
      ]);
      expect(preferences.favoriteWrites, isEmpty);
    });

    test('保存失敗を通知し、楽観更新した状態を維持する', () async {
      final preferences = _RecordingAppPreferences(
        failCompletedWrites: true,
        failFavoriteWrites: true,
      );
      final controller = AppController(
        preferences: preferences,
        validPatternIds: validPatternIds,
      );
      addTearDown(controller.dispose);
      await controller.initialize();
      final savingStates = <bool>[];
      controller.addListener(() => savingStates.add(controller.isSaving));

      await expectLater(controller.markCompleted('button'), completes);

      expect(controller.completed, const {'button'});
      expect(controller.favorites, isEmpty);
      expect(controller.isSaving, isFalse);
      expect(controller.storageError, isNotNull);
      expect(preferences.completedWrites, [
        const {'button'},
      ]);
      expect(savingStates, containsAllInOrder(<bool>[true, false]));

      await expectLater(controller.toggleFavorite('switch'), completes);

      expect(controller.completed, const {'button'});
      expect(controller.favorites, const {'switch'});
      expect(controller.isSaving, isFalse);
      expect(controller.storageError, isNotNull);
      expect(preferences.favoriteWrites, [
        const {'switch'},
      ]);

      controller.clearStorageError();

      expect(controller.storageError, isNull);
    });
  });
}

final class _RecordingAppPreferences implements AppPreferences {
  _RecordingAppPreferences({
    Set<String> completed = const <String>{},
    Set<String> favorites = const <String>{},
    this.failReads = false,
    this.failCompletedWrites = false,
    this.failFavoriteWrites = false,
  }) : _completed = {...completed},
       _favorites = {...favorites};

  Set<String> _completed;
  Set<String> _favorites;
  final bool failReads;
  final bool failCompletedWrites;
  final bool failFavoriteWrites;

  int readCompletedCalls = 0;
  int readFavoritesCalls = 0;
  final List<Set<String>> completedWrites = <Set<String>>[];
  final List<Set<String>> favoriteWrites = <Set<String>>[];

  @override
  Future<Set<String>> readCompleted() async {
    readCompletedCalls += 1;
    if (failReads) throw StateError('read completed failed');
    return {..._completed};
  }

  @override
  Future<Set<String>> readFavorites() async {
    readFavoritesCalls += 1;
    if (failReads) throw StateError('read favorites failed');
    return {..._favorites};
  }

  @override
  Future<void> writeCompleted(Set<String> ids) async {
    completedWrites.add({...ids});
    if (failCompletedWrites) throw StateError('write completed failed');
    _completed = {...ids};
  }

  @override
  Future<void> writeFavorites(Set<String> ids) async {
    favoriteWrites.add({...ids});
    if (failFavoriteWrites) throw StateError('write favorites failed');
    _favorites = {...ids};
  }
}
