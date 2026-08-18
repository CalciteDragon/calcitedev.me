import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ExtrasLevelConfig } from '../../../../../models/extra-level.model';

export type ExtrasLevelEditorMode = 'edit' | 'playtest';
export type ExtrasLevelProperty = 'x' | 'y' | 'width' | 'height';

export interface ExtrasLevelPropertyChange {
  readonly id: string;
  readonly property: ExtrasLevelProperty;
  readonly value: number;
}

type LevelElement = ExtrasLevelConfig['elements'][number];

@Component({
  selector: 'app-extras-level-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extras-level-editor.component.html',
  styleUrl: './extras-level-editor.component.scss',
})
export class ExtrasLevelEditorComponent {
  readonly level = input.required<ExtrasLevelConfig>();
  readonly selectedElementId = input<string | null>(null);
  readonly mode = input<ExtrasLevelEditorMode>('edit');
  readonly snapEnabled = input(true);
  readonly canUndo = input(false);
  readonly canRedo = input(false);
  readonly status = input('Editor ready.');

  readonly selectionChanged = output<string>();
  readonly modeChanged = output<ExtrasLevelEditorMode>();
  readonly snapChanged = output<boolean>();
  readonly addRequested = output<void>();
  readonly deleteRequested = output<void>();
  readonly duplicateRequested = output<void>();
  readonly undoRequested = output<void>();
  readonly redoRequested = output<void>();
  readonly resetRequested = output<void>();
  readonly copyRequested = output<void>();
  readonly downloadRequested = output<void>();
  readonly propertyChanged = output<ExtrasLevelPropertyChange>();

  protected readonly selectedElement = computed<LevelElement | null>(() => {
    const selectedId = this.selectedElementId();
    return selectedId === null
      ? null
      : (this.level().elements.find(element => element.id === selectedId) ?? null);
  });
  protected readonly editingLocked = computed(() => this.mode() !== 'edit');
  protected readonly selectedIsIsland = computed(() => this.selectedElement()?.kind === 'island');
  protected readonly canDeleteSelection = computed(
    () => !this.editingLocked() && this.selectedElement() !== null && !this.selectedIsIsland(),
  );
  protected readonly canDuplicateSelection = computed(
    () => !this.editingLocked() && this.selectedElement() !== null && !this.selectedIsIsland(),
  );

  protected selectElement(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement) || select.value === '') return;
    this.selectionChanged.emit(select.value);
  }

  protected setMode(mode: ExtrasLevelEditorMode): void {
    if (mode !== this.mode()) this.modeChanged.emit(mode);
  }

  protected toggleSnap(): void {
    if (!this.editingLocked()) this.snapChanged.emit(!this.snapEnabled());
  }

  protected updateProperty(property: ExtrasLevelProperty, event: Event): void {
    const element = this.selectedElement();
    const inputElement = event.currentTarget;
    if (!element || !(inputElement instanceof HTMLInputElement) || this.editingLocked()) return;
    if (element.kind === 'island' && (property === 'width' || property === 'height')) return;

    const value = inputElement.valueAsNumber;
    if (!Number.isFinite(value)) return;
    this.propertyChanged.emit({ id: element.id, property, value });
  }

  protected elementLabel(element: LevelElement): string {
    return element.kind === 'island'
      ? `Island: ${element.topicId}`
      : `Platform: ${element.id}`;
  }
}
