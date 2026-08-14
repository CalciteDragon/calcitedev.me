import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExtrasLevelConfig } from '../../../../../models/extra-level.model';
import { ExtrasLevelEditorComponent } from './extras-level-editor.component';

const level: ExtrasLevelConfig = {
  schemaVersion: 1,
  revision: 1,
  world: { width: 1880, height: 820 },
  spawn: { elementId: 'keyboard-island', offsetX: 58 },
  elements: [
    {
      id: 'keyboard-island',
      kind: 'island',
      topicId: 'keyboard',
      x: 662,
      y: 295,
      width: 556,
      height: 365,
    },
    {
      id: 'platform-1',
      kind: 'platform',
      x: 500,
      y: 430,
      width: 180,
      height: 24,
    },
  ],
};

describe('ExtrasLevelEditorComponent', () => {
  let fixture: ComponentFixture<ExtrasLevelEditorComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ExtrasLevelEditorComponent] }).compileComponents();
    fixture = TestBed.createComponent(ExtrasLevelEditorComponent);
    fixture.componentRef.setInput('level', level);
    fixture.componentRef.setInput('selectedElementId', 'platform-1');
    fixture.componentRef.setInput('canUndo', true);
    fixture.componentRef.setInput('canRedo', true);
    fixture.componentRef.setInput('status', 'Draft saved locally.');
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('renders an accessible element selector and live status', () => {
    const select = compiled.querySelector<HTMLSelectElement>('#level-editor-element');
    const options = Array.from(select?.options ?? []).map(option => option.textContent?.trim());

    expect(compiled.querySelector('aside')?.getAttribute('aria-label')).toBe('Extras level editor');
    expect(options).toEqual(['Select an element', 'Island: keyboard', 'Platform: platform-1']);
    expect(select?.value).toBe('platform-1');
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain('Draft saved locally.');
  });

  it('emits selection, mode, snap, and toolbar requests', () => {
    const selectionChanged = vi.fn();
    const modeChanged = vi.fn();
    const snapChanged = vi.fn();
    const addRequested = vi.fn();
    const undoRequested = vi.fn();
    const copyRequested = vi.fn();
    fixture.componentInstance.selectionChanged.subscribe(selectionChanged);
    fixture.componentInstance.modeChanged.subscribe(modeChanged);
    fixture.componentInstance.snapChanged.subscribe(snapChanged);
    fixture.componentInstance.addRequested.subscribe(addRequested);
    fixture.componentInstance.undoRequested.subscribe(undoRequested);
    fixture.componentInstance.copyRequested.subscribe(copyRequested);

    const select = compiled.querySelector<HTMLSelectElement>('#level-editor-element')!;
    select.value = 'keyboard-island';
    select.dispatchEvent(new Event('change'));
    button('Playtest').click();
    button('Snap 10px').click();
    button('Add platform').click();
    button('Undo').click();
    button('Copy config').click();

    expect(selectionChanged).toHaveBeenCalledWith('keyboard-island');
    expect(modeChanged).toHaveBeenCalledWith('playtest');
    expect(snapChanged).toHaveBeenCalledWith(false);
    expect(addRequested).toHaveBeenCalledOnce();
    expect(undoRequested).toHaveBeenCalledOnce();
    expect(copyRequested).toHaveBeenCalledOnce();
  });

  it('emits finite platform geometry changes', () => {
    const propertyChanged = vi.fn();
    fixture.componentInstance.propertyChanged.subscribe(propertyChanged);
    const inputs = inspectorInputs();

    inputs[0].value = '540';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[2].value = '220';
    inputs[2].dispatchEvent(new Event('input'));

    expect(propertyChanged).toHaveBeenNthCalledWith(1, {
      id: 'platform-1',
      property: 'x',
      value: 540,
    });
    expect(propertyChanged).toHaveBeenNthCalledWith(2, {
      id: 'platform-1',
      property: 'width',
      value: 220,
    });
  });

  it('emits platform mutation and persistence requests', () => {
    const duplicateRequested = vi.fn();
    const deleteRequested = vi.fn();
    const redoRequested = vi.fn();
    const resetRequested = vi.fn();
    const downloadRequested = vi.fn();
    fixture.componentInstance.duplicateRequested.subscribe(duplicateRequested);
    fixture.componentInstance.deleteRequested.subscribe(deleteRequested);
    fixture.componentInstance.redoRequested.subscribe(redoRequested);
    fixture.componentInstance.resetRequested.subscribe(resetRequested);
    fixture.componentInstance.downloadRequested.subscribe(downloadRequested);

    button('Duplicate').click();
    button('Delete').click();
    button('Redo').click();
    button('Reset draft').click();
    button('Download').click();

    expect(duplicateRequested).toHaveBeenCalledOnce();
    expect(deleteRequested).toHaveBeenCalledOnce();
    expect(redoRequested).toHaveBeenCalledOnce();
    expect(resetRequested).toHaveBeenCalledOnce();
    expect(downloadRequested).toHaveBeenCalledOnce();
  });

  it('protects island deletion, duplication, width, and height', () => {
    fixture.componentRef.setInput('selectedElementId', 'keyboard-island');
    fixture.detectChanges();
    const inputs = inspectorInputs();

    expect(button('Delete').disabled).toBe(true);
    expect(button('Duplicate').disabled).toBe(true);
    expect(inputs[0].disabled).toBe(false);
    expect(inputs[1].disabled).toBe(false);
    expect(inputs[2].disabled).toBe(true);
    expect(inputs[3].disabled).toBe(true);
  });

  it('disables geometry mutations while retaining export controls in playtest mode', () => {
    fixture.componentRef.setInput('mode', 'playtest');
    fixture.detectChanges();

    for (const label of ['Add platform', 'Duplicate', 'Delete', 'Undo', 'Redo', 'Snap 10px', 'Reset draft']) {
      expect(button(label).disabled, label).toBe(true);
    }
    expect(inspectorInputs().every(input => input.disabled)).toBe(true);
    expect(button('Copy config').disabled).toBe(false);
    expect(button('Download').disabled).toBe(false);
  });

  function button(label: string): HTMLButtonElement {
    const match = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      candidate => candidate.textContent?.trim() === label,
    );
    if (!match) throw new Error(`Missing button: ${label}`);
    return match;
  }

  function inspectorInputs(): HTMLInputElement[] {
    return Array.from(compiled.querySelectorAll<HTMLInputElement>('.level-editor__inspector input'));
  }
});
