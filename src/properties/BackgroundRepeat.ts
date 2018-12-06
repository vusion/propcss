import Fruit, { ValueNode, ValueNodeType } from '../Fruit';

export enum BackgroundRepeatKeyword {
    repeat = 'repeat',
    space = 'space',
    round = 'round',
    'no-repeat' = 'no-repeat',
}

const partialRE = /^(?:repeat-x|repeat-y|repeat|space|round|no-repeat)$/;

export default class BackgroundRepeat extends Fruit {
    protected _type: string = 'background-repeat';
    protected _state: { count: number };
    x: BackgroundRepeatKeyword;
    y: BackgroundRepeatKeyword;

    constructor(value?: string);
    constructor(x: BackgroundRepeatKeyword, y?: BackgroundRepeatKeyword) {
        super(x);
        if (arguments.length > 1) {
            this.x = x;
            this.y = y;
        }
    }

    protected init() {
        this._state = { count: 0 };
        this.x = undefined;
        this.y = undefined;
    }

    protected analyzeInLoop(node: ValueNode): boolean {
        if (node.type === ValueNodeType.space || node.type === ValueNodeType.comment)
            return false;
        else if (node.type === ValueNodeType.word) {
            if (node.value === 'repeat-x') {
                if (this._state.count > 0)
                    throw new SyntaxError('Excessive keywords found');
                else {
                    this.x = BackgroundRepeatKeyword.repeat;
                    this.y = BackgroundRepeatKeyword['no-repeat'];
                    this._state.count += 2;
                }
            } else if (node.value === 'repeat-y') {
                if (this._state.count > 0)
                    throw new SyntaxError('Excessive keywords found');
                else {
                    this.x = BackgroundRepeatKeyword['no-repeat'];
                    this.y = BackgroundRepeatKeyword.repeat;
                    this._state.count += 2;
                }
            } else if (Object.keys(BackgroundRepeatKeyword).includes(node.value)) {
                if (this._state.count > 1)
                    throw new SyntaxError('Excessive keywords found');
                else if (this._state.count === 0) {
                    this.x = this.y = node.value as BackgroundRepeatKeyword;
                    this._state.count++;
                } else if (this._state.count === 1) {
                    this.y = node.value as BackgroundRepeatKeyword;
                    this._state.count++;
                } else
                    throw new Error('State Problem!');
            } else
                return true;
        } else // Break loop due to incompatible node.type or node.value
            return true;
    }

    toString(complete?: boolean) {
        if (!complete) {
            if (this.x === this.y)
                return this.x;
            else if (this.x === BackgroundRepeatKeyword.repeat && this.y === BackgroundRepeatKeyword['no-repeat'])
                return 'repeat-x';
            else if (this.y === BackgroundRepeatKeyword.repeat && this.x === BackgroundRepeatKeyword['no-repeat'])
                return 'repeat-y';
            // else go on
        }

        return [this.x, this.y].join(' ');
    }
}