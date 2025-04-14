<template>
    <p class="vm-turn-status">{{ turnStatusText }}</p>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import TurnStatus from '../../ts/protocol/TurnStatus';
import { I18n } from '../../ts/i18n';

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
    inject: ['i18n'],
    computed: {
        TheI18n() {
            return (this.i18n as I18n);
        },
        turnStatusText() {
            if (this.turnStatus.turnTime !== null) {
                return computed(() => this.TheI18n.GetString('kVM_TurnTimeTimer', this.turnCounter));
            } else if (this.turnStatus.queueTime !== null) {
                return computed(() => this.TheI18n.GetString('kVM_WaitingTurnTimer', this.turnCounter));
            } else {
                return "";
            }
        }
    }
});
</script>