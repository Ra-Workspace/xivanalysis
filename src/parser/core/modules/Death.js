import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import { Item } from 'parser/core/modules/Timeline'

// One of these being applied to an actor signifies they're back up
const RAISE_STATUSES = [
	STATUSES.PHOENIXS_BLESSING.id,
	STATUSES.WEAKNESS.id,
	STATUSES.BRINK_OF_DEATH.id
]

export default class Death extends Module {
	static dependencies = [
		'timeline'
	]

	_count = 0
	_timestamp = null

	on_death_toPlayer(event) {
		this._count ++
		this._timestamp = event.timestamp
	}

	on_applydebuff_toPlayer(event) {
		// Only care about raises
		if (!RAISE_STATUSES.includes(event.ability.guid)) {
			return
		}

		this.addDeathToTimeline(event.timestamp)
	}

	// If they cast/begincast, they were probably LB3'd, just mark end of death
	// TODO: I mean there's an actual LB3 action cast, it's just not in the logs. Look into it.
	on_event(event) {
		if (
			['cast', 'begincast'].includes(event.type) &&
			this.parser.byPlayer(event) &&
			this._timestamp
		) {
			this.addDeathToTimeline(event.timestamp)
		}
	}

	on_complete() {
		if (this._timestamp) {
			this.addDeathToTimeline(this.parser.fight.end_time)
		}

		// TODO: death suggestion
	}

	addDeathToTimeline(end) {
		const startTime = this.parser.fight.start_time
		this.timeline.addItem(new Item({
			type: 'background',
			start: this._timestamp - startTime,
			end: end - startTime
		}))
		this._timestamp = null
	}
}