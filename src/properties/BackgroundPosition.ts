import Fruit, { ValueNode, ValueNodeType } from '../Fruit';
import Length from '../dataTypes/Length';
import Percentage from '../dataTypes/Percentage';

enum BackgroundPositionKeyword {
    center = 'center',
    left = 'left',
    right = 'right',
    top = 'top',
    bottom = 'bottom',
}

export interface BackgroundPositionValue {
    origin: BackgroundPositionKeyword;
    offset: Length | Percentage | string;
}

export default class BackgroundPosition extends Fruit {
    protected _type: string = 'background-position';
    protected _state: { count: number, lastType: string };
    x: BackgroundPositionValue;
    y: BackgroundPositionValue;

    protected init() {
        super.init();
        this._state = { count: 0, lastType: undefined };
        this.x = { origin: undefined, offset: undefined };
        this.y = { origin: undefined, offset: undefined };
    }

    // toResult(): Fruit | string {

    // }

    protected analyzeInLoop(node: ValueNode): boolean {
        if (node.type === ValueNodeType.space || node.type === ValueNodeType.comment)
            return false;
        else if (node.type === ValueNodeType.word) {
            /**
             * 4 types: center, left, top, 40%
             */
            if (node.value === BackgroundPositionKeyword.center) {
                if (this._state.count >= 2)
                    throw new SyntaxError('Excessive keyword');
                else if (this._state.count === 0) {
                    this.x.origin = this.y.origin = node.value;
                    this._state.lastType = 'center';
                    this._state.count++;
                    this.valid = true;
                } else if (this._state.count === 1) {
                    /**
                     * [o] (center) + center === (center ? center ?) === (center ? center ?)
                     * [o] (left) + center === (left ? center ?) === (left ? center ?)
                     * [o] (top) + center === (center ? top ?) === (center ? top ?)
                     * [o] (20%) + center === (left 20% ? center ?) === (left 20% ? center ?)
                     */
                    // Do nothing
                    this._state.lastType = 'center';
                    this._state.count++;
                    this.valid = true;
                }
            } else if (node.value === BackgroundPositionKeyword.left || node.value === BackgroundPositionKeyword.right) {
                if (this._state.count >= 3)
                    throw new SyntaxError('Excessive keyword');
                else if (this._state.count === 0) {
                    this.x.origin = node.value;
                    this.y.origin = BackgroundPositionKeyword.center;
                    this._state.lastType = 'x';
                    this._state.count++;
                    this.valid = true;
                } else if (this._state.count === 1) {
                    /**
                     * [o] (center) + left === (left ? center ?) =x= (center ? center ?)
                     * [x] (left) + left ~~~ (xxx xxx xxx xxx) ~~~ (left ? center ?)
                     * [o] (top) + left === (left ? top ?) =x= (center ? top ?)
                     * [x] (20%) + left === (xxx xxx xxx xxx) === (left 20% ? center ?)
                     */
                    if (this.x.origin !== BackgroundPositionKeyword.center)
                        throw new SyntaxError('Duplicated keywords: ' + node.value);
                    this.x.origin = node.value;
                    this._state.lastType = 'x';
                    this._state.count++;
                    this.valid = true;
                } else if (this._state.count === 2) {
                    /**
                     * [x] (center center) + left ~~~ (center ? center ?)
                     * [x] (center left) + left ~~~ (left ? center ?)
                     * [x] (center top) + left ~~~ (center ? top ?)
                     * [x] (center 40%) + left ~~~ (center ? top 40%)
                     * [x] (left center) + left ~~~ (left ? center ?)
                     * ------ [x] (left left) + left ~~~ (xxx xxx xxx xxx)
                     * [x] (left top) + left ~~~ (left ? top ?)
                     * [x] (left 40%) + left ~~~ (left x top 40%)
                     * [x] (top center) + left ~~~ (center ? top ?)
                     * [x] (top left) + left ~~~ (left ? top ?)
                     * ------ [x] (top top) + left ~~~ (xxx xxx xxx xxx)
                     * [o] (top 40%) + left === (left ? top 40%) =x= [x](center 40% top ?)
                     * [x] (20% center) + left ~~~ (left 20% center ?)
                     * ------ [x] (20% left) + left ~~~ (xxx xxx xxx xxx)
                     * [x] (20% top) + left ~~~ (left 20% top ?)
                     * [x] (20% 40%) + left ~~~ (left 20% top 40%)
                     */
                    if (this.x.origin === BackgroundPositionKeyword.center && this.x.offset) {
                        this.x.origin = node.value;
                        this.y.offset = this.x.offset;
                        this.x.offset = undefined;
                        this._state.lastType = 'x';
                        this._state.count++;
                        this.valid = true;
                    } else
                        throw new SyntaxError('Excessive keyword: ' + node.value);
                }
            } else if (node.value === BackgroundPositionKeyword.top || node.value === BackgroundPositionKeyword.bottom) {
                if (this._state.count >= 3)
                    throw new SyntaxError('Excessive keyword');
                else if (this._state.count === 0) {
                    this.y.origin = node.value;
                    this.x.origin = BackgroundPositionKeyword.center;
                    this._state.lastType = 'y';
                    this._state.count++;
                    this.valid = true;
                } else if (this._state.count === 1) {
                    /**
                     * [o] (center) + top === (center ? top ?) =x= (center ? center ?)
                     * [o] (left) + top === (left ? top ?) ~~~ (left ? center ?)
                     * [x] (top) + top ~~~ (xxx xxx xxx xxx) =x= (center ? top ?)
                     * [o] (20%) + top === (left 20% top ?) === (left 20% ? center ?)
                     */
                    if (this.y.origin !== BackgroundPositionKeyword.center)
                        throw new SyntaxError('Duplicated keywords: ' + node.value);
                    this.y.origin = node.value;
                    this._state.lastType = 'y';
                    this._state.count++;
                    this.valid = true;
                } else if (this._state.count === 2) {
                    /**
                     * [x] (center center) + top ~~~ (center ? center ?)
                     * [x] (center left) + top ~~~ (left ? center ?)
                     * [x] (center top) + top ~~~ (center ? top ?)
                     * [x] (center 40%) + top ~~~ (center ? top 40%)
                     * [x] (left center) + top ~~~ (left ? center ?)
                     * ------ [x] (left left) + top ~~~ (xxx xxx xxx xxx)
                     * [x] (left top) + top ~~~ (left ? top ?)
                     * [o] (left 40%) + top === (left 40% top ?) =x= (left ? top 40%)
                     * [x] (top center) + top ~~~ (center ? top ?)
                     * [x] (top left) + top ~~~ (left ? top ?)
                     * ------ [x] (top top) + top ~~~ (xxx xxx xxx xxx)
                     * [x] (top 40%) + top ~~~ (center 40% top ?)
                     * [x] (20% center) + top ~~~ (left 20% center ?)
                     * ------ [x] (20% left) + top ~~~ (xxx xxx xxx xxx)
                     * [x] (20% top) + top ~~~ (left 20% top ?)
                     * [x] (20% 40%) + top ~~~ (left 20% top 40%)
                     */
                    if (this.x.origin !== BackgroundPositionKeyword.center && this.y.offset && !this.x.offset) {
                        this.y.origin = node.value;
                        this.x.offset = this.y.offset;
                        this.y.offset = undefined;
                        this._state.lastType = 'y';
                        this._state.count++;
                        this.valid = true;
                    } else
                        throw new SyntaxError('Excessive keyword: ' + node.value);
                }
            } else {
                const length = Length.parse(node.value) as Length | string; // '0' is truthy
                const percentage = Percentage.parse(node.value) as Percentage | string
                let lengthPercentage = length || percentage;
                if (!lengthPercentage)
                    return true;

                if (this._state.count >= 4)
                    throw new SyntaxError('Excessive <length-percentage> value: ' + lengthPercentage);
                else if (this._state.count === 0) {
                    this.x.offset = lengthPercentage;
                    this.x.origin = BackgroundPositionKeyword.left;
                    this.y.origin = BackgroundPositionKeyword.center;
                    this._state.lastType = 'lengthPercentage';
                    this._state.count++;
                    this.valid = true;
                } else if (this._state.count === 1) {
                    /**
                     * [o] (center) + 40% === (center ? top 40%) =x= (center ? center ?)
                     * [o] (left) + 40% === (left ? top 40%) =x= (left ? center ?)
                     * [~] (top) + 40% === (center 40% top ?) =x= (center ? top ?)
                     * [o] (20%) + 40% === (left 20% top 40%) === (left 20% ? center ?)
                     */
                    if (this.y.origin !== BackgroundPositionKeyword.center) {
                        this.x.offset = lengthPercentage;
                        this._state.lastType = 'lengthPercentage';
                        this._state.count++;
                        this.valid = false;
                    } else {
                        this.y.origin = BackgroundPositionKeyword.top;
                        this.y.offset = lengthPercentage;
                        this._state.lastType = 'lengthPercentage';
                        this._state.count++;
                        this.valid = true;
                    }
                } else if (this._state.count === 2) {
                    /**
                     * [x] (center center) + 60% ~~~ (center ? center ?)
                     * [x] (center left) + 60% ~~~ (left ? center ?)
                     * [x] (center top) + 60% ~~~ (center ? top ?)
                     * [x] (center 40%) + 60% ~~~ (center ? top 40%)
                     * [x] (left center) + 60% ~~~ (left ? center ?)
                     * ------ [x] (left left) + 60% ~~~ (xxx xxx xxx xxx)
                     * [o] (left top) + 60% === (left ? top 60%) ~~~ (left ? top ?)
                     * [x] (left 40%) + 60% ~~~ (left ? top 40%)
                     * [x] (top center) + 60% ~~~ (center ? top ?)
                     * [o] (top left) + 60% === (left 60% top ?) ~~~ (left ? top ?)
                     * ------ [x] (top top) + 60% ~~~ (xxx xxx xxx xxx)
                     * [x] (top 40%) + 60% ~~~ (center 40% top ?)
                     * [x] (20% center) + 60% ~~~ (left 20% center ?)
                     * ------ [x] (20% left) + 60% ~~~ (xxx xxx xxx xxx)
                     * [x] (20% top) + 60% ~~~ (left 20% top ?)
                     * [x] (20% 40%) + 60% ~~~ (left 20% top 40%)
                     */
                    if (this.x.origin !== BackgroundPositionKeyword.center && !this.x.offset
                        && this.y.origin !== BackgroundPositionKeyword.center && !this.y.offset) {
                        if (this._state.lastType === 'x')
                            this.x.offset = lengthPercentage;
                        else if (this._state.lastType === 'y')
                            this.y.offset = lengthPercentage;
                        else
                            throw new Error('xxx');
                    } else
                        throw new SyntaxError('Excessive <length-percentage> value: ' + lengthPercentage);
                } else if (this._state.count === 3) {
                    /**
                     * [o] (top 40% left) + 80% === (left 80% top 40%) =x= (left ? top 40%)
                     * [o] (left 40% top) + 80% === (left 40% top 80%) =x= (left 40% top ?)
                     * [o] (left top 60%) + 80% === (left ? top 60%) ~~~ (left ? top 60%)
                     * [o] (top left 60%) + 80% === (left 60% top ?) ~~~ (left 60% top ?)
                     */
                    if (this._state.lastType === 'length-percentage')
                        throw new Error('Excessive <length-percentage> value: ' + lengthPercentage);
                    if (!this.x.offset)
                        this.x.offset = lengthPercentage;
                    else if (!this.y.offset)
                        this.y.offset = lengthPercentage;
                    else
                        throw Error('Something wrong');
                    this._state.count++;
                    this.valid = true;
                }
            }
        } else // Break loop due to incompatible node.type or node.value
            return true;
    }
}
