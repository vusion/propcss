import Fruit, { ValueNode, ValueNodeType, ParseDeepLevel, Stem } from '../Fruit';
import URL from './URL';

export default class Image extends Fruit {
    protected _type: string = 'image';
    protected _parseDeepLevelBoundary: ParseDeepLevel = ParseDeepLevel.dataTypes;
    protected _state: { count: number };
    value: URL | string;

    constructor();
    constructor(value: string | URL);
    constructor(value?: string | URL) {
        super();
        try {
            if (arguments.length === 0)
                return;
            else if (typeof value === 'string')
                this.parse(value);
            else if (value instanceof URL) {
                // @矛盾: 赋值给`this.value`时，应不应该检查 URL 本身的合法性？
                this.value = value.toResult() as URL | string;
                this.valid = value.valid;
            }
        } catch (e) {
            if (this.options.throwErrors)
                throw e;
        }
    }

    protected init() {
        super.init();
        this._state = { count: 0 };
        this.value = undefined;
    }

    toResult(): Fruit | string {
        if (!this.valid)
            return super.toResult();
        if (typeof this.value === 'string')
            return this.value;
        else
            return this.value.toResult();
    }

    protected analyzeInLoop(node: ValueNode, stem: Stem) {
        if (node.type === ValueNodeType.space || node.type === ValueNodeType.comment)
            return true;
        else if (node.type === ValueNodeType.function) {
            if (node.unclosed)
                throw new SyntaxError(`Unclosed function '${node.value}'`);
            if (node.value === 'url') {
                if (this.value)
                    throw new SyntaxError(`Excessive value '${node.value}'`);
                const url = new URL();
                url.analyze(stem);
                if (!url.valid)
                    throw new SyntaxError(`Invalid <url> '${node.value}'`);
                this.value = url.toResult() as URL | string;
                this.valid = true;
                return false;
            } // else
            // cont gradient = new Gradient();
        }
    }

    toString(complete?: boolean): string {
        if (!this.valid)
            return super.toString();
        return this.value.toString();
    }
}
