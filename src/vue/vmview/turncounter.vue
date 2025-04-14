<template>
    <p class="vm-turn-status">{{ turnStatusText }}</p>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TurnStatus from '../../ts/protocol/TurnStatus';

export default defineComponent({
    data() {
        return {
            turnStatus: {} as TurnStatus,
            turnTickInterval: 0,
            turnCounter: 0
        }
    },
    methods: {
        turnUpdate(status: TurnStatus) {
            this.turnStatus = status;
            clearInterval(this.turnTickInterval);

            if (status.turnTime !== null || status.queueTime !== null) {
                this.turnCounter = Math.floor((status.turnTime ?? status.queueTime)! / 1000);
                this.turnTickInterval = setInterval(() => this.turnTick(), 1000) as unknown as number;
            }
        },
        turnTick() {
            --this.turnCounter;
            if (this.turnCounter <= 0 || (this.turnStatus.turnTime === null && this.turnStatus.queueTime === null)) {
                clearInterval(this.turnTickInterval);
            }
        }
    },
    computed: {
        turnStatusText() {
            if (this.turnStatus.turnTime !== null) {
                return `Turn expires in ${this.turnCounter} seconds`;
            } else if (this.turnStatus.queueTime !== null) {
                return `Waiting for turn in ${this.turnCounter} seconds`;
            } else {
                return "";
            }
        }
    }
});
</script>